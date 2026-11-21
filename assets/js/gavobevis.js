/* Gåvobevis: förhandsvisning och formulär. */
(function () {
  "use strict";
  var form = document.getElementById("gift-form");
  if (!form) return;
  var custom = document.getElementById("g-custom");
  var MIN = 100;
  var MAX_MSG = 240;

  function amount() {
    if (custom.value.trim()) return Math.round(Number(custom.value.replace(/\s/g, "").replace(",", ".")));
    var r = form.querySelector('input[name="belopp"]:checked');
    return r ? Number(r.value) : 0;
  }
  function text(id, value, fallback) {
    document.getElementById(id).textContent = value.trim() || fallback;
  }

  function update() {
    var a = amount();
    var kr = a ? a.toLocaleString("sv-SE") + " kr" : "…";
    document.getElementById("p-amount").textContent = kr;
    document.getElementById("g-submit").textContent = a ? "Betala och skicka · " + kr : "Betala och skicka";
    var m = form.querySelector('input[name="motiv"]:checked');
    if (m) document.getElementById("p-img").src = "assets/img/motiv-" + m.value + ".jpg";
    text("p-to", form.to.value, "…");
    text("p-from", form.from.value, "…");
    text("p-msg", form.message.value, "Din hälsning visas här.");
    document.getElementById("g-message-count").textContent = (MAX_MSG - form.message.value.length) + " tecken kvar";
    document.getElementById("g-recipient-field").hidden = form.leverans.value !== "mottagare";
  }

  form.addEventListener("input", function (e) {
    if (e.target === custom && custom.value) {
      form.querySelectorAll('input[name="belopp"]').forEach(function (r) { r.checked = false; });
    }
    if (e.target.name === "belopp") custom.value = "";
    if (e.target.getAttribute("aria-invalid") && e.target.value.trim()) window.FCForm.clearError(e.target);
    update();
  });
  form.addEventListener("change", update);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var checks = [
      [custom, function () { return amount() >= MIN; }, "Välj ett belopp på minst " + MIN + " kr."],
      [form.to, function (v) { return v.trim().length > 0; }, "Skriv vem gåvobeviset är till."],
      [form.from, function (v) { return v.trim().length > 0; }, "Skriv vem gåvobeviset är från."],
      [form.recipient, function (v) { return form.leverans.value !== "mottagare" || email.test(v.trim()); }, "Skriv mottagarens e-post."],
      [form.email, function (v) { return email.test(v.trim()); }, "Skriv din e-postadress."]
    ];
    var first = null;
    checks.forEach(function (c) {
      if (c[1](c[0].value)) { window.FCForm.clearError(c[0]); }
      else { window.FCForm.showError(c[0], c[2]); if (!first) first = c[0]; }
    });
    if (first) { first.focus(); return; }
    // Prototyp: här skapas en Stripe-betalning. Beviset mejlas när betalningen är klar.
    window.location.href = "tack.html?typ=gavobevis&belopp=" + amount() +
      "&leverans=" + encodeURIComponent(form.leverans.value) + "&demo=1";
  });

  update();
})();
