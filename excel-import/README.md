# Monthly Excel import from Outlook

This script runs **on your own computer**. It looks in your Outlook inbox for
the monthly email (matched by subject), takes the Excel attachment, and appends
its rows to a master Excel file you choose. It remembers which emails it has
already imported, so you can run it as often as you like without duplicating data.

It works with the **classic Outlook desktop app on Windows** — no passwords or
IT approvals needed, because it reads the mail through Outlook itself.
(The "new Outlook" app and web Outlook are not supported by this method.)

## One-time setup

1. **Install Python** from <https://www.python.org/downloads/> if you don't
   have it. During installation, tick **"Add python.exe to PATH"**.
   (On a Coop machine you may need to install it via the company software
   portal instead.)

2. **Install the two required packages.** Open Command Prompt in this folder
   and run:

   ```
   pip install -r requirements.txt
   ```

3. **Edit `config.json`** and fill in your details:

   | Setting | What to put there |
   |---|---|
   | `email_subject_contains` | Part of the subject of the monthly email, e.g. `"Monthly sales report"`. Not case-sensitive. |
   | `outlook_mailbox` | Which mailbox to search. Leave `""` for your own default mailbox. If the email arrives in a shared or secondary mailbox shown in Outlook's folder list (e.g. `"nicolaj.albion@coop.dk"`), put its name here. If the name doesn't match, the script lists the mailboxes it can see. |
   | `outlook_folder` | Where the email lands. `"Inbox"`, or the name of another folder — the script looks both inside the Inbox and at the top level of your mailbox (folders next to the Inbox), so just the folder's name is enough, e.g. `"Monthly reports"`. Use `/` for nested folders, e.g. `"Reports/Monthly"`. If the name is wrong, the script lists your folders so you can pick the right one. |
   | `search_days_back` | How many days back to look for the email. 40 is fine for a monthly email. |
   | `master_excel_path` | Full path to the Excel file the data should be added to. It is created automatically if it doesn't exist yet. |
   | `master_sheet_name` | The sheet in the master file to append to. |
   | `attachment_sheet_name` | Which sheet to read in the attachment. Leave `""` to use the first sheet. |
   | `attachment_header_rows` | How many header rows to skip in the attachment (usually `1`). |
   | `add_source_columns` | If `true`, two extra columns are added to each imported row: the date the email was received and its subject. Handy for tracing where rows came from. |
   | `attachment_save_folder` | Where a copy of each attachment is saved. |

## Running it

Make sure Outlook is running, then double-click **`run_import.bat`**
(or run `python import_monthly_excel.py` in a terminal).

The script will:

1. Find emails from the last `search_days_back` days whose subject contains your text.
2. Skip any email it has imported before (tracked in `processed_emails.json`).
3. Save the Excel attachment to the attachment folder.
4. Append its data rows to the master file, below the existing data.

Everything it does is also written to `import.log` in this folder, so you can
check afterwards what happened.

**Note:** the master Excel file must be closed while the script runs —
Excel locks open files. The script tells you if this happens.

## Running it automatically every month

Use **Windows Task Scheduler**:

1. Press the Windows key, search for *Task Scheduler*, open it.
2. Click **Create Basic Task…**, name it e.g. *Monthly Excel import*.
3. Trigger: **Monthly**, pick a day a little after the email usually arrives.
   (It's safe to schedule it weekly or even daily instead — if there's no new
   email, the script simply does nothing.)
4. Action: **Start a program**, and browse to `run_import.bat` in this folder.
5. Finish. Outlook must be running (or at least you must be logged in) when
   the task fires.

## If something goes wrong

- **`No new emails found…`** — check that `email_subject_contains` really
  appears in the subject, and that the email is in the folder set in
  `outlook_folder` and not older than `search_days_back` days.
- **`…is probably open in Excel`** — close the master file and run again.
- **Re-importing an email on purpose** — delete `processed_emails.json`
  (all emails in the search window will then be imported again) or remove
  just that email's ID from the file.
- **Old `.xls` attachments** — the script only reads modern `.xlsx`/`.xlsm`
  files; the log will tell you if the sender uses the old format.
