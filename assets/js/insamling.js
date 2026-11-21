/*
 * Uppgifter för insamlingen. Ändra här – inget annat behöver röras.
 *
 * FCFagelvanMal: målmätaren. Stapeln fylls efter kronor per månad – inte antal
 *             personer – eftersom det är summan som avgör om driften täcks.
 *             Visas på startsidan, Stöd oss och tacksidan.
 *             Etappmål: när målet är nått byter mätaren till bufferten, och när
 *             även den är nådd visas ett tack. Mätaren lovar aldrig att driften
 *             är "säkrad", eftersom ingen vet hur många fåglar som kommer.
 * anvandning: "Så används din gåva" på Stöd oss. Fyll i "andel" (procent)
 *             när föreningen har siffror; utan andel visas bara listan.
 */
window.FCFagelvanMal = {
  ar: "2027",
  malKrPerManad: 30000,     // målet från Fågelvänner, kr per månad (räknat på ett normalår)
  buffertKrPerManad: 40000, // nästa mål när målet är nått: buffert för år med många fåglar
  insamlatKrPerManad: 8700, // summan av alla aktiva månadsgåvor (räknas automatiskt via Stripe senare)
  antal: 87,                // antal Fågelvänner
  exempel: true             // sätt till false när siffrorna är riktiga
};

window.FCInsamling = {
  faglarIAr: "2 300",
  ar: "2026",
  anvandning: [
    { rubrik: "Foder och vätska", text: "Rätt föda för varje art – från insekter till fisk.", andel: null },
    { rubrik: "Vård och medicin", text: "Medicin, förband och veterinärkontakter.", andel: null },
    { rubrik: "Voljärer och drift", text: "Uppvärmning, el och underhåll av rehabiliteringsvoljärerna.", andel: null }
  ],

  /* Stödföretag. Visas likadant på startsidan och företagssidan, i
     bokstavsordning. Nivån är bara för föreningens egen koll och visas inte.
     Exempel:
     { namn: "Exempel AB", niva: "Havsörn", logga: "assets/img/stodforetag/exempel.png", lank: "https://exempel.se" }
     Tom lista = sektionerna visas inte. */
  stodforetag: []
};
