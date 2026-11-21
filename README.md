# Fågelcentralen

Webbplats för Fågelcentralen, byggd efter skisserna i Figma. Ren HTML, CSS och JavaScript, utan byggsteg.

## Sidor

| Fil | Sida |
| --- | --- |
| `index.html` | Startsida |
| `hjalp-en-fagel.html` | Hittat en fågel? (akut fågelhjälp, råd) |
| `kontakt.html` | Kontakt (telefon för fågelhjälp, e-post för övrigt) |
| `om-oss.html` | Om oss |
| `volontar.html` | Volontäruppdrag och ansökningsformulär |
| `stod-oss.html` | Stöd oss: Bli Fågelvän (månadsgåva, förvald), engångsgåva, Swish, bankgiro, Månadens patient |
| `minnesgava.html` | Minnesgåva |
| `foretag.html` | Bli stödföretag (Talgoxe, Ormvråk, Havsörn, Kungsörn, Pilgrimsfalk) |
| `gavobevis.html` | Digitalt gåvobevis med motiv, hälsning och förhandsvisning |
| `onskelista.html` | Fåglarnas önskelista (material) |
| `bli-fagelvan.html` | Skickar vidare till Stöd oss (finns kvar så att gamla länkar fungerar) |
| `nyheter.html`, `nyhet.html` | Nyhetslista och enskild nyhet |
| `tack.html` | Tacksida efter gåva (erbjuder månadsgåva efter engångsgåva) |
| `admin/index.html` | Administration: översikt och viktigt meddelande (visas överst på alla sidor) |
| `admin/volontaruppdrag.html` | Administration: volontäruppdrag och ansökningar |
| `admin/nyheter.html` | Administration: nyheter |

## Kör lokalt

```bash
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000.

## Efter ändringar i CSS eller JavaScript

Kör

```bash
python3 tools/ny-version.py
```

Skriptet ger CSS- och JavaScript-filerna ett nytt versionsnummer i alla HTML-sidor (`styles.css?v=…`). Annars kan besökare få ny HTML ihop med en gammal, sparad CSS-fil, och då ser sidan trasig ut. Byt också filnamn på bilder som ersätts, av samma skäl.

## Struktur

- `assets/css/styles.css` – gemensam stilmall (färger och typsnitt som variabler överst)
- `assets/css/admin.css` – stilar för administrationen
- `assets/js/main.js` – meny, kopiera-knappar, gåvoformulär, målmätare
- `assets/js/tack.js` – tacksidan
- `assets/js/insamling.js` – **målmätaren, antal fåglar i år och ”Så används din gåva” (ändra här)**
- `assets/js/nyheter.js` – datalager för nyheter och webbplatsmeddelande
- `assets/js/nyheter-sida.js` – visar nyheter på webbplatsen
- `assets/js/admin-nyheter.js` – nyhetsadministrationen
- `assets/fonts/` – typsnitten ligger på sajten (inga anrop till Google, bra för GDPR och laddtid)
- `assets/js/uppdrag.js` – datalager för volontäruppdrag och ansökningar
- `assets/js/volontar.js` – volontärsidan
- `assets/js/admin.js` – administrationen
- `assets/img/` – bilder

Sidhuvud och sidfot finns i varje HTML-fil. Ändras de behöver alla sidor uppdateras.

## Att göra innan lansering

- **Bilder:** `volontar.jpg` och `kalender-2027.jpg` är fortfarande lågupplösta utklipp ur skisserna. Byt dem mot original med samma filnamn. Styrelsens porträtt visas som initialer tills foton finns.
- **Backend för admin:** administrationen (uppdrag, ansökningar, nyheter, meddelande) är en fungerande prototyp som sparar i webbläsarens `localStorage`. Uppdrag som publiceras i admin syns direkt på `volontar.html` i samma webbläsare, men inte för andra besökare. Byt funktionerna i `assets/js/uppdrag.js` mot API-anrop och lägg inloggning framför `admin/`.
- **Betalning:** knapparna Fortsätt och Bli Fågelvän går i dag direkt till `tack.html` i demoläge. Koppla dem till Stripe Checkout med `tack.html?typ=engang|manad&belopp=…` som adress efter lyckad betalning, och ta bort `demo=1`.
- **Målmätaren** visar exempelsiffror (87 av 300). Fyll i riktigt mål och antal i `assets/js/insamling.js` och sätt `exempel: false`.
- **Så används din gåva:** lägg till procentsatser (`andel`) i `assets/js/insamling.js` när föreningen har siffror.
- **Månadens patient** visar en exempeltext tills föreningen fyller i en riktig patient under Administration → Översikt.
- **Stödföretag:** bekräfta nivåer, priser och förmåner. Lägg till stödföretag i `assets/js/insamling.js` (`stodforetag`) så visas de på startsidan och företagssidan – alla likadant, i bokstavsordning och utan nivå. Julgåvorutan visas bara i november och december.
- **Gåvobevis:** bekräfta belopp (100/250/500 kr, minst 100 kr) och motiv. Att mejla beviset kräver betalning och e-post från en server (görs när backend kopplas in).
- **Minnesgåva:** bekräfta att föreningen kan meddela anhöriga när någon mejlar om en minnesgåva.
- **Texterna under månadsbeloppen** (vad 50/100/200 kr räcker till) behöver bekräftas av föreningen.
- **Länkar som saknar mål (`href="#"`):** integritetspolicy, cookies och villkor.

## SEO

- Titlar och beskrivningar är skrivna för sökningar som ”skadad fågel Göteborg”.
- Startsidan och Hjälp en fågel har strukturerad data (schema.org `NGO`) med telefon, adress och telefontider.
- Open Graph-taggar för delning i sociala medier. **När domänen är bestämd:** lägg till `og:image` (absolut adress till en bild, minst 1200×630 px), `<link rel="canonical">` på varje sida, `url` i den strukturerade datan och en `sitemap.xml`. Registrera sajten i Google Search Console.
- `robots.txt` stänger ute `admin/` och `tack.html` (fungerar först när sajten ligger på en egen domän).
- Nyheter visas med JavaScript. Google läser det, men när en backend finns är det bättre om nyhetssidorna genereras som färdig HTML.
