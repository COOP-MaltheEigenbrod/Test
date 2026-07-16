"""Send en SMS via SP247-gatewayen gennem Outlook (Windows).

Brug:
    python send_sms.py -t 12345678              # standardbesked til angivet nummer
    python send_sms.py -t 12345678 Min besked   # angiv nummer og besked

Kraever: pip install pywin32  (og at Outlook er aaben og logget ind)
"""

import argparse
import re
import sys

try:
    import win32com.client as win32
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False

GATEWAY_DOMAIN = "sms.sp247.net"
SMS_SUBJECT = "R-MGD"
OL_MAIL_ITEM = 0  # Outlook-konstant: olMailItem
SMS_SEGMENT_LENGTH = 160


def normaliser_nummer(telefonnummer):
    """Normaliserer et dansk telefonnummer til +45XXXXXXXX.

    Accepterer fx: '12345678', '12 34 56 78', '+4512345678',
    '004512345678' og '4512345678'.
    Returnerer None hvis nummeret ikke kan genkendes.
    """
    cifre = re.sub(r"[\s\-\.]", "", telefonnummer)

    if cifre.startswith("+45"):
        cifre = cifre[3:]
    elif cifre.startswith("0045"):
        cifre = cifre[4:]
    elif cifre.startswith("45") and len(cifre) == 10:
        cifre = cifre[2:]

    if not cifre.isdigit() or len(cifre) != 8:
        return None

    return "+45" + cifre


def send_sms(telefonnummer, besked):
    """Sender en SMS via SP247-gatewayen. Returnerer True ved succes."""
    if not HAS_WIN32:
        print("FEJL: Modulet 'pywin32' er ikke installeret. Kan ikke styre Outlook.")
        print("Koer: pip install pywin32")
        return False

    nummer = normaliser_nummer(telefonnummer)
    if nummer is None:
        print(f"FEJL: '{telefonnummer}' er ikke et gyldigt dansk mobilnummer (8 cifre).")
        return False

    if len(besked) > SMS_SEGMENT_LENGTH:
        print(f"ADVARSEL: Beskeden er {len(besked)} tegn og fylder mere end "
              f"een SMS ({SMS_SEGMENT_LENGTH} tegn pr. segment).")

    gateway_email = f"{nummer}@{GATEWAY_DOMAIN}"

    try:
        print(f"Sender SMS til {nummer} via {gateway_email}...")
        outlook = win32.Dispatch("Outlook.Application")
        mail = outlook.CreateItem(OL_MAIL_ITEM)

        mail.To = gateway_email
        mail.Subject = SMS_SUBJECT
        mail.Body = besked

        mail.Send()
        print("OK: SMS afsendt via Outlook.")
        return True
    except Exception as e:
        print(f"FEJL ved afsendelse (husk at Outlook skal vaere aaben og logget ind): {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Send en test-SMS via SP247-gatewayen gennem Outlook.")
    parser.add_argument("-t", "--telefonnummer", required=True,
                        help="Modtagerens mobilnummer (8 cifre, evt. med +45)")
    parser.add_argument("besked", nargs="*",
                        help="Beskedteksten (standard: testbesked)")
    args = parser.parse_args()

    besked = " ".join(args.besked) if args.besked else "Test SMS fra isoleret script"

    ok = send_sms(args.telefonnummer, besked)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
