"""
Monthly Excel import from Outlook.

Finds the most recent email in Outlook whose subject contains a configured
text, saves its Excel attachment, and appends the rows to a master Excel
file on this computer. Emails that have already been imported are remembered
in processed_emails.json so running the script twice never duplicates data.

Requires: Windows, the classic Outlook desktop app, Python 3.9+,
and the packages in requirements.txt (pywin32, openpyxl).

Usage:  python import_monthly_excel.py
"""

import json
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

import win32com.client
from openpyxl import Workbook, load_workbook

SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_PATH = SCRIPT_DIR / "config.json"
PROCESSED_PATH = SCRIPT_DIR / "processed_emails.json"
LOG_PATH = SCRIPT_DIR / "import.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)


def load_config() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        text = f.read()
    try:
        config = json.loads(text)
    except json.JSONDecodeError as e:
        lines = text.splitlines()
        bad_line = lines[e.lineno - 1] if 0 < e.lineno <= len(lines) else ""
        pointer = " " * (e.colno - 1) + "^"
        log.error(
            "The config file this script is reading is not valid JSON.\n"
            "  File:  %s\n"
            "  Error: %s (line %d, column %d)\n"
            "  Line %d reads:\n"
            "    %s\n"
            "    %s\n"
            "Common causes:\n"
            "  - Windows paths: use forward slashes (\"C:/Users/...\") or double "
            "backslashes (\"C:\\\\Users\\\\...\") - single backslashes break JSON\n"
            "  - A missing comma at the end of the previous line\n"
            "  - A missing quote around a value\n"
            "If this line is not what you typed, you are editing a different file "
            "than the one shown above (check for a hidden .txt extension).",
            CONFIG_PATH, e.msg, e.lineno, e.colno, e.lineno, bad_line, pointer,
        )
        sys.exit(1)
    if "PUT PART OF THE EMAIL SUBJECT" in config["email_subject_contains"]:
        log.error("Please edit config.json first: set 'email_subject_contains' "
                  "to (part of) the subject of the monthly email.")
        sys.exit(1)
    return config


def load_processed_ids() -> set:
    if PROCESSED_PATH.exists():
        with open(PROCESSED_PATH, encoding="utf-8") as f:
            return set(json.load(f))
    return set()


def save_processed_ids(ids: set) -> None:
    with open(PROCESSED_PATH, "w", encoding="utf-8") as f:
        json.dump(sorted(ids), f, indent=2)


def get_outlook_folder(config: dict):
    outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")

    mailbox = (config.get("outlook_mailbox") or "").strip()
    if mailbox:
        store = None
        for s in outlook.Stores:
            if mailbox.lower() in s.DisplayName.lower():
                store = s
                break
        if store is None:
            available = "\n  - ".join(s.DisplayName for s in outlook.Stores)
            log.error("Could not find mailbox %r in Outlook. Mailboxes available "
                      "in your Outlook are:\n  - %s", mailbox, available)
            sys.exit(1)
        inbox = store.GetDefaultFolder(6)  # 6 = olFolderInbox
    else:
        inbox = outlook.GetDefaultFolder(6)

    folder_name = config.get("outlook_folder", "Inbox")
    if folder_name.lower() in ("", "inbox"):
        return inbox

    parts = [p for p in folder_name.replace("\\", "/").split("/") if p]

    def resolve(start):
        folder = start
        for part in parts:
            folder = folder.Folders(part)
        return folder

    # Try the path as a subfolder of the Inbox first, then from the top level
    # of the mailbox (folders that sit next to the Inbox, e.g. ones an Outlook
    # rule moves mail into).
    for start in (inbox, inbox.Parent):
        try:
            return resolve(start)
        except Exception:
            continue

    available = ", ".join(f.Name for f in inbox.Parent.Folders)
    log.error("Could not find Outlook folder %r. Top-level folders in your "
              "mailbox are: %s. For a nested folder use '/' between names, "
              "e.g. \"Reports/Monthly\".", folder_name, available)
    sys.exit(1)


def find_matching_emails(folder, config: dict, processed_ids: set) -> list:
    """Return unprocessed emails whose subject matches, oldest first."""
    subject_text = config["email_subject_contains"].lower()
    days_back = int(config.get("search_days_back", 40))
    cutoff = datetime.now() - timedelta(days=days_back)

    items = folder.Items
    items.Sort("[ReceivedTime]", True)  # newest first
    items = items.Restrict(
        "[ReceivedTime] >= '" + cutoff.strftime("%m/%d/%Y %I:%M %p") + "'"
    )

    matches = []
    for item in items:
        try:
            if item.Class != 43:  # 43 = olMail
                continue
            if subject_text not in (item.Subject or "").lower():
                continue
            if item.EntryID in processed_ids:
                log.info("Skipping already-imported email: %r (%s)",
                         item.Subject, item.ReceivedTime)
                continue
            matches.append(item)
        except Exception:  # some items (meeting invites etc.) lack properties
            continue
    matches.reverse()  # oldest first, so data lands in chronological order
    return matches


def save_excel_attachment(mail, save_folder: Path) -> Path | None:
    save_folder.mkdir(parents=True, exist_ok=True)
    for attachment in mail.Attachments:
        name = attachment.FileName or ""
        if not name.lower().endswith((".xlsx", ".xlsm", ".xls")):
            continue
        stamp = mail.ReceivedTime.strftime("%Y-%m-%d")
        target = save_folder / f"{stamp}_{name}"
        attachment.SaveAsFile(str(target))
        log.info("Saved attachment to %s", target)
        return target
    return None


def read_attachment_rows(path: Path, config: dict) -> list:
    """Return the data rows (header rows skipped) from the attachment."""
    if path.suffix.lower() == ".xls":
        log.error("%s is an old .xls file, which openpyxl cannot read. "
                  "Open it in Excel and check whether the sender can send "
                  ".xlsx instead.", path.name)
        return []
    wb = load_workbook(path, data_only=True, read_only=True)
    sheet_name = config.get("attachment_sheet_name") or None
    ws = wb[sheet_name] if sheet_name else wb.worksheets[0]
    header_rows = int(config.get("attachment_header_rows", 1))
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < header_rows:
            continue
        if all(cell is None or str(cell).strip() == "" for cell in row):
            continue  # skip completely empty rows
        rows.append(list(row))
    wb.close()
    return rows


def append_to_master(rows: list, mail, config: dict) -> None:
    master_path = Path(config["master_excel_path"])
    sheet_name = config.get("master_sheet_name", "Data")

    if master_path.exists():
        wb = load_workbook(master_path)
        ws = wb[sheet_name] if sheet_name in wb.sheetnames else wb.create_sheet(sheet_name)
    else:
        log.info("Master file does not exist yet, creating %s", master_path)
        master_path.parent.mkdir(parents=True, exist_ok=True)
        wb = Workbook()
        ws = wb.active
        ws.title = sheet_name

    add_source = bool(config.get("add_source_columns", True))
    received = mail.ReceivedTime.strftime("%Y-%m-%d")
    for row in rows:
        if add_source:
            row = row + [received, mail.Subject]
        ws.append(row)

    try:
        wb.save(master_path)
    except PermissionError:
        log.error("Could not save %s - it is probably open in Excel. "
                  "Close it and run the script again.", master_path)
        sys.exit(1)
    log.info("Appended %d rows to %s (sheet '%s')", len(rows), master_path, sheet_name)


def main() -> None:
    config = load_config()
    processed_ids = load_processed_ids()

    folder = get_outlook_folder(config)
    emails = find_matching_emails(folder, config, processed_ids)
    if not emails:
        log.info("No new emails found with subject containing %r in the last "
                 "%s days. Nothing to do.",
                 config["email_subject_contains"], config.get("search_days_back", 40))
        return

    save_folder = Path(config.get("attachment_save_folder") or (SCRIPT_DIR / "attachments"))
    imported = 0
    for mail in emails:
        log.info("Processing email %r received %s", mail.Subject, mail.ReceivedTime)
        attachment_path = save_excel_attachment(mail, save_folder)
        if attachment_path is None:
            log.warning("Email has no Excel attachment, skipping it.")
            processed_ids.add(mail.EntryID)
            continue
        rows = read_attachment_rows(attachment_path, config)
        if not rows:
            log.warning("No data rows found in %s, skipping it.", attachment_path.name)
            continue
        append_to_master(rows, mail, config)
        processed_ids.add(mail.EntryID)
        save_processed_ids(processed_ids)
        imported += 1

    save_processed_ids(processed_ids)
    log.info("Done. Imported %d email(s).", imported)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log.exception("Import failed with an unexpected error:")
        sys.exit(1)
