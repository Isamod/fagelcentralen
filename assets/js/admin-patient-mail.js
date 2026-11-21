/* Månadens patient: skriva, förhandsgranska och skicka mejlet till Fågelvänner (prototyp). */
(function () {
  "use strict";
  var store = window.FCNyheter;
  var toast = window.FCToast;
  var formHelp = window.FCForm;
  var form = document.getElementById("mp-form");
  var dialog = document.getElementById("mp-confirm");
  var fileInput = document.getElementById("mp-image");
  var removeImg = document.getElementById("mp-remove-image");
  var image = "";

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pv(key) { return document.querySelector('[data-pv="' + key + '"]'); }
  function subs() { return store.subscribers(); }

  /* ---------- Förhandsvisning ---------- */
  function preview() {
    pv("subject").textContent = form.subject.value.trim() || "Ämnesrad";
    pv("preheader").textContent = form.preheader.value.trim() ? " – " + form.preheader.value.trim() : "";
    pv("title").textContent = form.title.value.trim() || "Rubrik";
    pv("species").textContent = form.species.value.trim();
    pv("species").hidden = !form.species.value.trim();
    var text = form.text.value.trim();
    pv("text").innerHTML = text
      ? text.split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; }).join("")
      : '<p class="muted">Berättelsen visas här.</p>';
    var img = pv("image");
    img.hidden = !image;
    if (image) { img.src = store.imageSrc(image, "../"); img.alt = form.imageAlt.value.trim(); }
    removeImg.hidden = !image;
  }

  function readForm() {
    return {
      subject: form.subject.value.trim(), preheader: form.preheader.value.trim(),
      title: form.title.value.trim(), species: form.species.value.trim(),
      text: form.text.value.trim(), image: image, imageAlt: form.imageAlt.value.trim()
    };
  }

  function load() {
    var d = store.mpDraft();
    form.subject.value = d.subject || "";
    form.preheader.value = d.preheader || "";
    form.title.value = d.title || "";
    form.species.value = d.species || "";
    form.text.value = d.text || "";
    form.imageAlt.value = d.imageAlt || "";
    image = d.image || "";
    preview();
  }

  form.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") && e.target.value.trim()) formHelp.clearError(e.target);
    preview();
  });

  /* ---------- Bild (förminskas) ---------- */
  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file || !/^image\//.test(file.type)) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        image = c.toDataURL("image/jpeg", 0.8);
        preview();
        if (!form.imageAlt.value.trim()) form.imageAlt.focus();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  removeImg.addEventListener("click", function () { image = ""; fileInput.value = ""; preview(); });

  /* ---------- Knappar ---------- */
  function validate() {
    var fields = [form.subject, form.title, form.text];
    var bad = fields.filter(function (f) { return !f.value.trim(); });
    fields.forEach(function (f) { formHelp.clearError(f); });
    bad.forEach(function (f) {
      var label = document.querySelector('label[for="' + f.id + '"]').textContent.replace(" *", "");
      formHelp.showError(f, label + " måste fyllas i.");
    });
    if (bad.length) bad[0].focus();
    return !bad.length;
  }

  document.getElementById("mp-save").addEventListener("click", function () {
    toast(store.saveMpDraft(readForm()) === false ? "Kunde inte spara – prova en mindre bild." : "Utkastet är sparat.");
  });

  document.getElementById("mp-test").addEventListener("click", function () {
    if (!validate()) return;
    store.saveMpDraft(readForm());
    toast("Prototyp: när utskicket är kopplat skickas ett testmejl till din e-post.");
  });

  document.getElementById("mp-send").addEventListener("click", function () {
    if (!validate()) return;
    var n = subs().length;
    if (!n) { toast("Det finns inga mottagare än."); return; }
    dialog.querySelector("[data-confirm-text]").textContent =
      "”" + form.subject.value.trim() + "” skickas till " + n + " Fågelvänner. Det går inte att ångra.";
    if (typeof dialog.showModal === "function") dialog.showModal();
  });
  document.getElementById("mp-confirm-no").addEventListener("click", function () { dialog.close(); });
  document.getElementById("mp-confirm-yes").addEventListener("click", function () {
    var issue = readForm();
    issue.recipients = subs().length;
    issue.image = ""; // historiken behöver inte bilden
    store.addMpSent(issue);
    store.clearMpDraft();
    dialog.close();
    form.reset();
    image = "";
    preview();
    renderSent();
    toast("Prototyp: utskicket är sparat i historiken. Mejlen skickas när e-posttjänsten är kopplad.");
  });

  /* ---------- Mottagare ---------- */
  function renderSubs() {
    var list = subs();
    document.querySelector("[data-sub-count]").textContent = list.length;
    document.getElementById("mp-send").textContent = "Skicka till " + list.length + " Fågelvänner";
    var el = document.getElementById("sub-list");
    if (!list.length) { el.innerHTML = '<div class="empty">Inga mottagare än.</div>'; return; }
    el.innerHTML = '<ul class="sub-list">' + list.map(function (x) {
      return '<li><div><strong>' + esc(x.namn) + "</strong>" +
        (x.example ? ' <span class="badge draft">Exempel</span>' : "") + (x.demo ? ' <span class="badge">Demo</span>' : "") +
        '<span class="sub-meta">' + esc(x.email) + " · sedan " + esc(store.formatDate(x.sedan)) + "</span></div>" +
        '<button class="btn btn-danger" type="button" data-remove-sub="' + esc(x.id) + '">Ta bort<span class="visually-hidden"> ' + esc(x.namn) + "</span></button></li>";
    }).join("") + "</ul>";
  }
  document.getElementById("sub-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-remove-sub]");
    if (!b || !window.confirm("Ta bort mottagaren? Personen får inga fler mejl, men fortsätter som Fågelvän.")) return;
    store.removeSubscriber(b.getAttribute("data-remove-sub"));
    renderSubs();
    toast("Mottagaren är borttagen.");
  });

  /* ---------- Tidigare utskick ---------- */
  function renderSent() {
    var list = store.mpSent();
    var el = document.getElementById("sent-list");
    if (!list.length) { el.innerHTML = '<div class="empty">Inga utskick än.</div>'; return; }
    el.innerHTML = '<ul class="sub-list">' + list.map(function (x) {
      var d = new Date(x.sentAt).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
      return "<li><div><strong>" + esc(x.subject) + '</strong><span class="sub-meta">' + esc(d) + " · " + x.recipients + " mottagare</span></div></li>";
    }).join("") + "</ul>";
  }

  load();
  renderSubs();
  renderSent();
})();
