# Stormvogels RSVP

Een mobiele uitnodigingspagina voor België - Nieuw-Zeeland op 27 juni, met:

- de gevraagde ja/nee-vraag;
- een vraag met hoeveel personen ze komen;
- een conditionele vraag over koffiekoeken;
- een beheeroverzicht met totalen en namen;
- CSV-download voor Excel;
- één antwoord per toestel, dat later nog gewijzigd kan worden.

## Eerst bekijken

Open `index.html`. Zonder online koppeling werkt de site in demomodus en worden antwoorden alleen op het huidige toestel bewaard.

Het beheeroverzicht staat op:

`index.html?admin`

In demomodus mag de beheercode leeg blijven.

## Antwoorden centraal verzamelen in Google Sheets

1. Maak een nieuwe Google Spreadsheet.
2. Kies **Extensies → Apps Script**.
3. Vervang de inhoud van `Code.gs` door de inhoud van `google-apps-script/Code.gs`.
4. Verander bovenaan `ADMIN_PIN` in een eigen geheime beheercode.
5. Kies **Implementeren → Nieuwe implementatie → Web-app**.
6. Uitvoeren als: **ikzelf**. Toegang: **iedereen**.
7. Kopieer de URL die eindigt op `/exec`.
8. Plak die URL in `config.js` bij `apiUrl`.

Daarna komen alle antwoorden automatisch in het tabblad **Antwoorden** van de Google Spreadsheet.

## Online zetten en delen via WhatsApp

De map kan gratis worden gepubliceerd met onder meer Netlify Drop, Cloudflare Pages of GitHub Pages. Deel daarna de publieke URL via WhatsApp.

Voor het beheeroverzicht voeg je `?admin` achter de URL:

`https://jouw-adres.example/?admin`

Deel die beheerlink en je beheercode niet met genodigden.
