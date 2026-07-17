"""Send en SMS (via SP247-gatewayen) eller en almindelig email gennem Outlook (Windows).

Brug:
    python send_sms.py -t 12345678 Min besked            # SMS til dansk mobilnummer
    python send_sms.py -e nogen@firma.dk Min besked      # Email til adresse
    python send_sms.py -e nogen@firma.dk --emne "Hej" Min besked

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
STANDARD_EMAIL_EMNE = "Besked fra Python-script"
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


def _send_outlook_mail(modtager, emne, besked):
    """Sender en mail via Outlook. Returnerer True ved succes."""
    if not HAS_WIN32:
        print("FEJL: Modulet 'pywin32' er ikke installeret. Kan ikke styre Outlook.")
        print("Koer: pip install pywin32")
        return False

    try:
        outlook = win32.Dispatch("Outlook.Application")
        mail = outlook.CreateItem(OL_MAIL_ITEM)

        mail.To = modtager
        mail.Subject = emne
        mail.Body = besked

        mail.Send()
        return True
    except Exception as e:
        print(f"FEJL ved afsendelse (husk at Outlook skal vaere aaben og logget ind): {e}")
        return False


def send_sms(telefonnummer, besked):
    """Sender en SMS via SP247-gatewayen. Returnerer True ved succes."""
    nummer = normaliser_nummer(telefonnummer)
    if nummer is None:
        print(f"FEJL: '{telefonnummer}' er ikke et gyldigt dansk mobilnummer (8 cifre).")
        return False

    if len(besked) > SMS_SEGMENT_LENGTH:
        print(f"ADVARSEL: Beskeden er {len(besked)} tegn og fylder mere end "
              f"een SMS ({SMS_SEGMENT_LENGTH} tegn pr. segment).")

    gateway_email = f"{nummer}@{GATEWAY_DOMAIN}"
    print(f"Sender SMS til {nummer} via {gateway_email}...")

    if _send_outlook_mail(gateway_email, SMS_SUBJECT, besked):
        print("OK: SMS afsendt via Outlook.")
        return True
    return False


def send_email(adresse, besked, emne=STANDARD_EMAIL_EMNE):
    """Sender en almindelig email via Outlook. Returnerer True ved succes."""
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", adresse):
        print(f"FEJL: '{adresse}' ligner ikke en gyldig email-adresse.")
        return False

    print(f"Sender email til {adresse} (emne: {emne})...")

    if _send_outlook_mail(adresse, emne, besked):
        print("OK: Email afsendt via Outlook.")
        return True
    return False


def main():
    parser = argparse.ArgumentParser(
        description="Send en SMS (via SP247-gatewayen) eller en email gennem Outlook.")
    modtager = parser.add_mutually_exclusive_group(required=True)
    modtager.add_argument("-t", "--telefonnummer",
                          help="Modtagerens mobilnummer (8 cifre, evt. med +45)")
    modtager.add_argument("-e", "--email",
                          help="Modtagerens email-adresse")
    parser.add_argument("--emne", default=STANDARD_EMAIL_EMNE,
                        help="Emnelinje - bruges kun ved email (standard: '%(default)s')")
    parser.add_argument("besked", nargs="*",
                        help="Beskedteksten (standard: testbesked)")
    args = parser.parse_args()

    besked = " ".join(args.besked) if args.besked else "Test besked fra isoleret script"

    if args.telefonnummer:
        ok = send_sms(args.telefonnummer, besked)
    else:
        ok = send_email(args.email, besked, args.emne)

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
