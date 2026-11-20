# Fågelcentralen

Webbplats för Fågelcentralen, byggd efter skisserna i Figma. Ren HTML, CSS och JavaScript, utan byggsteg.

## Sidor

| Fil | Sida |
| --- | --- |
| `index.html` | Startsida |
| `hjalp-en-fagel.html` | Hjälp en fågel |
| `om-oss.html` | Om oss |
| `volontar.html` | Volontäruppdrag och ansökningsformulär |
| `stod-oss.html` | Stöd oss (engångsgåva / månadsgåva, Swish, bankgiro) |
| `bli-fagelvan.html` | Bli Fågelvän (månadsgivande) |
| `tack.html` | Tacksida efter gåva (erbjuder månadsgåva efter engångsgåva) |
| `admin/volontaruppdrag.html` | Administration av volontäruppdrag |

## Kör lokalt

```bash
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000.

## Struktur

- `assets/css/styles.css` – gemensam stilmall (färger och typsnitt som variabler överst)
- `assets/css/admin.css` – stilar för administrationen
- `assets/js/main.js` – meny, kopiera-knappar, gåvoformulär, målmätare
- `assets/js/fagelvan-mal.js` – **mål och antal Fågelvänner för målmätaren (ändra här)**
- `assets/js/tack.js` – tacksidan
- `assets/js/uppdrag.js` – datalager för volontäruppdrag och ansökningar
- `assets/js/volontar.js` – volontärsidan
- `assets/js/admin.js` – administrationen
- `assets/img/` – bilder

Sidhuvud och sidfot finns i varje HTML-fil. Ändras de behöver alla sidor uppdateras.

## Att göra innan lansering

- **Bilder:** bilderna i `assets/img/` är tillfälligt utklippta ur skisserna och har låg upplösning. Byt dem mot originalen med samma filnamn. Styrelsens porträtt visas som initialer tills foton finns.
- **Backend för volontäruppdrag:** administrationen och ansökningarna är en fungerande prototyp som sparar i webbläsarens `localStorage`. Uppdrag som publiceras i admin syns direkt på `volontar.html` i samma webbläsare, men inte för andra besökare. Byt funktionerna i `assets/js/uppdrag.js` mot API-anrop och lägg inloggning framför `admin/`.
- **Betalning:** knapparna Fortsätt och Bli Fågelvän går i dag direkt till `tack.html` i demoläge. Koppla dem till Stripe Checkout med `tack.html?typ=engang|manad&belopp=…` som adress efter lyckad betalning, och ta bort `demo=1`.
- **Målmätaren** visar exempelsiffror (87 av 300). Fyll i riktigt mål och antal i `assets/js/fagelvan-mal.js` och sätt `exempel: false`.
- **Texterna under månadsbeloppen** (vad 50/100/200 kr räcker till) behöver bekräftas av föreningen.
- **Länkar som saknar mål (`href="#"`):** integritetspolicy, cookies, villkor, Alla nyheter, nyhetsartiklarna, Bli medlem och KFV-länkarna på Hjälp en fågel (märkta `data-todo="KFV-länk"`).
