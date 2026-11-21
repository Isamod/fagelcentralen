/* Administration av partner och stödföretag (prototyp med localStorage). */
(function () {
  "use strict";
  var store = window.FCNyheter;
  var toast = window.FCToast;
  var listEl = document.getElementById("partner-list");
  var form = document.getElementById("partner-form");
  var fileInput = document.getElementById("pa-logo");
  var preview = document.getElementById("pa-preview");
  var removeLogo = document.getElementById("pa-remove-logo");
  var submit = document.getElementById("pa-submit");
  var cancel = document.getElementById("pa-cancel");
  var TYPES = { partner: "Samarbetspartner", foretag: "Stödföretag" };

  var editing = null; // id som redigeras, eller null
  var logo = "";

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    var items = store.partners().slice().sort(function (a, b) {
      return (a.typ + a.namn).localeCompare(b.typ + b.namn, "sv");
    });
    document.getElementById("example-note").hidden = !items.some(function (x) { return x.example; });
    if (!items.length) {
      listEl.innerHTML = '<div class="empty">Inga partner ännu. Lägg till den första i formuläret.</div>';
      return;
    }
    listEl.innerHTML = items.map(function (x) {
      return '<article class="news-row' + (editing === x.id ? " is-editing" : "") + '">' +
        '<div class="thumb logo-thumb">' + (x.logga ? '<img src="' + esc(store.imageSrc(x.logga, "../")) + '" alt="">' : "") + "</div>" +
        "<div><h2>" + esc(x.namn) + (x.example ? ' <span class="badge draft">Exempel</span>' : "") + "</h2>" +
        "<p>" + esc(TYPES[x.typ] || x.typ) + (x.lank ? " · " + esc(x.lank) : "") + "</p></div>" +
        '<div class="row-actions">' +
          (x.example ? "" : '<button class="btn btn-light" type="button" data-edit="' + esc(x.id) + '">Ändra</button>') +
          '<button class="btn btn-danger" type="button" data-remove="' + esc(x.id) + '">Ta bort<span class="visually-hidden"> ' + esc(x.namn) + "</span></button>" +
        "</div></article>";
    }).join("");
  }

  function showLogo(src) {
    logo = src || "";
    preview.hidden = !logo;
    removeLogo.hidden = !logo;
    if (logo) preview.querySelector("img").src = store.imageSrc(logo, "../");
  }

  function resetForm() {
    editing = null;
    form.reset();
    showLogo("");
    submit.textContent = "Lägg till";
    cancel.hidden = true;
    document.getElementById("form-heading").textContent = "Lägg till";
    window.FCForm.clearError(form.namn);
    window.FCForm.clearError(form.lank);
    render();
  }

  listEl.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-remove]");
    var ed = e.target.closest("[data-edit]");
    if (rm) {
      var item = store.partners().filter(function (x) { return x.id === rm.getAttribute("data-remove"); })[0];
      if (!item || !window.confirm("Ta bort ”" + item.namn + "”?")) return;
      store.removePartner(item.id);
      if (editing === item.id) resetForm(); else render();
      toast("”" + item.namn + "” är borttagen.");
    }
    if (ed) {
      var x = store.partners().filter(function (p) { return p.id === ed.getAttribute("data-edit"); })[0];
      if (!x) return;
      editing = x.id;
      form.namn.value = x.namn;
      form.lank.value = x.lank || "";
      document.getElementById(x.typ === "foretag" ? "pa-foretag" : "pa-partner").checked = true;
      showLogo(x.logga);
      submit.textContent = "Spara ändringar";
      cancel.hidden = false;
      document.getElementById("form-heading").textContent = "Ändra " + x.namn;
      render();
      form.namn.focus();
    }
  });

  cancel.addEventListener("click", resetForm);

  /* Logotyp: SVG sparas som den är, andra format förminskas (genomskinlighet behålls) */
  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast("Välj en bildfil."); fileInput.value = ""; return; }
    var reader = new FileReader();
    reader.onload = function () {
      if (file.type === "image/svg+xml") { showLogo(reader.result); return; }
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, 600 / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        showLogo(c.toDataURL(file.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.9));
      };
      img.onerror = function () { toast("Bilden kunde inte läsas."); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  removeLogo.addEventListener("click", function () { fileInput.value = ""; showLogo(""); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    if (!form.namn.value.trim()) { window.FCForm.showError(form.namn, "Skriv ett namn."); ok = false; }
    else window.FCForm.clearError(form.namn);
    var url = form.lank.value.trim();
    if (url && !/^https?:\/\/\S+\.\S+/.test(url)) { window.FCForm.showError(form.lank, "Skriv hela adressen, t.ex. https://exempel.se"); ok = false; }
    else window.FCForm.clearError(form.lank);
    if (!ok) { (form.querySelector('[aria-invalid="true"]') || form.namn).focus(); return; }
    var item = { id: editing || "", namn: form.namn.value.trim(), typ: form.typ.value, logga: logo, lank: url };
    if (store.savePartner(item) === false) { toast("Kunde inte spara – prova en mindre bild."); return; }
    toast(editing ? "Ändringarna är sparade." : "”" + item.namn + "” är tillagd.");
    resetForm();
  });

  document.getElementById("remove-examples").addEventListener("click", function () {
    store.removeExamplePartners();
    render();
    toast("Exemplen är borttagna.");
  });

  render();
})();
