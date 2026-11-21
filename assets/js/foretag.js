/* Företagssidan: välj nivå, säsongsrutor, stödföretagslista och formuläret. */
(function () {
  "use strict";

  /* "Välj Havsörn" m.fl. väljer nivån i formuläret */
  document.querySelectorAll("[data-choose-tier]").forEach(function (link) {
    link.addEventListener("click", function () {
      var name = link.getAttribute("data-choose-tier");
      var radio = document.querySelector('#company-form input[name="niva"][value="' + name + '"]');
      if (radio) radio.checked = true;
      setTimeout(function () { var f = document.getElementById("c-company"); if (f) f.focus({ preventScroll: true }); }, 0);
    });
  });

  /* Julrutan visas bara i november och december */
  var month = new Date().getMonth();
  document.querySelectorAll('[data-season="jul"]').forEach(function (el) {
    if (month < 10) el.hidden = true;
  });

  /* Formuläret Bli stödföretag */
  var form = document.getElementById("company-form");
  var success = document.getElementById("company-success");
  if (!form || !window.FCUppdrag) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var checks = [
      ["c-company", function (v) { return v.trim().length > 1; }, "Skriv företagets namn."],
      ["c-orgnr", function (v) { return /^\d{6}-?\d{4}$/.test(v.trim()); }, "Skriv organisationsnumret, t.ex. 556677-8899."],
      ["c-contact", function (v) { return v.trim().length > 1; }, "Skriv en kontaktperson."],
      ["c-email", function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, "Skriv en giltig e-postadress."]
    ];
    var first = null;
    checks.forEach(function (c) {
      var input = document.getElementById(c[0]);
      if (c[1](input.value)) { window.FCForm.clearError(input); }
      else { window.FCForm.showError(input, c[2]); if (!first) first = input; }
    });
    if (first) { first.focus(); return; }
    var d = new FormData(form);
    window.FCUppdrag.addCompany({
      niva: d.get("niva"), company: d.get("company"), orgnr: d.get("orgnr"),
      contact: d.get("contact"), email: d.get("email"), phone: d.get("phone"), message: d.get("message")
    });
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });
})();
