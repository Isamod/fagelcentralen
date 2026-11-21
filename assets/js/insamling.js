/*
 * Uppgifter för insamlingen. Ändra här – inget annat behöver röras.
 *
 * mal:        målmätaren för Fågelvänner (visas på Stöd oss och tacksidan).
 * anvandning: "Så används din gåva" på Stöd oss. Fyll i "andel" (procent)
 *             när föreningen har siffror; utan andel visas bara listan.
 */
window.FCFagelvanMal = {
  rubrik: "Vi behöver 300 Fågelvänner för att klara driften 2027",
  mal: 300,
  antal: 87,
  exempel: true
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
