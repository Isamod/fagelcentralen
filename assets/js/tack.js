/* Tacksidan: anpassar texten efter gåvotyp och belopp i adressen. */
(function () {
  "use strict";
  var q = new URLSearchParams(window.location.search);
  var typ = q.get("typ") === "manad" ? "manad" : "engang";
  var belopp = parseInt(q.get("belopp"), 10);
  var harBelopp = belopp > 0 && belopp < 1000000;
  var kr = harBelopp ? belopp.toLocaleString("sv-SE") + " kr" : "";

  function set(id, text) { document.getElementById(id).textContent = text; }

  if (q.get("demo") === "1") document.getElementById("demo-note").hidden = false;

  if (typ === "manad") {
    set("thanks-eyebrow", "Fågelvän");
    set("thanks-title", "Tack – nu är du Fågelvän!");
    set("thanks-lead", harBelopp
      ? "Dina " + kr + " varje månad ger fler fåglar en andra chans, månad efter månad."
      : "Ditt månadsstöd ger fler fåglar en andra chans, månad efter månad.");
    set("thanks-receipt", "En bekräftelse skickas till din e-post.");
    document.getElementById("welcome").hidden = false;
    if (q.get("patient") === "1") document.getElementById("welcome-patient").hidden = false;
  } else {
    set("thanks-title", harBelopp ? "Tack för dina " + kr + "!" : "Tack för din gåva!");
    set("thanks-lead", "Din gåva hjälper en skadad eller sjuk vild fågel redan i dag.");
    document.getElementById("upsell").hidden = false;
  }
})();
