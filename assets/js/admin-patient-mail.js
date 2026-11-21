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

  function later() { return form.when.value === "senare"; }
  function minDate() {
    var d = new Date(Date.now() + 10 * 60000);
    d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  function updateWhen() {
    document.getElementById("mp-at-field").hidden = !later();
    form.at.min = minDate();
    var n = subs().length;
    document.getElementById("mp-send").textContent = later() ? "Schemalägg till " + n + " Fågelvänner" : "Skicka till " + n + " Fågelvänner";
  }
  form.addEventListener("change", function (e) { if (e.target.name === "when") updateWhen(); });
  function fmt(iso) {
    return new Date(iso).toLocaleString("sv-SE", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  }

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
    formHelp.clearError(form.at);
    if (later() && (!form.at.value || new Date(form.at.value) <= new Date())) {
      formHelp.showError(form.at, "Välj en tid som inte har passerat.");
      bad.push(form.at);
    }
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
    dialog.querySelector("[data-confirm-text]").textContent = later()
      ? "”" + form.subject.value.trim() + "” skickas " + fmt(form.at.value) + " till alla Fågelvänner med Månadens patient – just nu " + n + " personer. Du kan ändra eller avbryta fram till dess."
      : "”" + form.subject.value.trim() + "” skickas till " + n + " Fågelvänner. Det går inte att ångra.";
    document.getElementById("mp-confirm-yes").textContent = later() ? "Ja, schemalägg" : "Ja, skicka";
    if (typeof dialog.showModal === "function") dialog.showModal();
  });
  document.getElementById("mp-confirm-no").addEventListener("click", function () { dialog.close(); });
  document.getElementById("mp-confirm-yes").addEventListener("click", function () {
    if (later()) {
      var planned = readForm();
      planned.sendAt = new Date(form.at.value).toISOString();
      if (store.addMpScheduled(planned) === false) { toast("Kunde inte spara – prova en mindre bild."); return; }
      store.clearMpDraft();
      dialog.close();
      form.reset();
      image = "";
      preview();
      updateWhen();
      renderSched();
      toast("Mejlet är schemalagt till " + fmt(planned.sendAt) + ".");
      return;
    }
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

  /* ---------- Schemalagda ---------- */
  function processDue() {
    // Prototyp: när tiden har passerat flyttas utskicket till historiken.
    // På riktigt sköts detta av servern eller e-posttjänsten.
    store.mpScheduled().forEach(function (x) {
      if (new Date(x.sendAt) <= new Date()) {
        store.removeMpScheduled(x.id);
        store.addMpSent({ subject: x.subject, title: x.title, recipients: subs().length, image: "" });
      }
    });
  }
  function renderSched() {
    var list = store.mpScheduled();
    var el = document.getElementById("sched-list");
    if (!list.length) { el.innerHTML = '<div class="empty">Inga schemalagda utskick.</div>'; return; }
    el.innerHTML = '<ul class="sub-list">' + list.map(function (x) {
      return "<li><div><strong>" + esc(x.subject) + '</strong><span class="sub-meta">Skickas ' + esc(fmt(x.sendAt)) + "</span></div>" +
        '<div class="row-actions"><button class="btn btn-light" type="button" data-edit-sched="' + esc(x.id) + '">Ändra</button>' +
        '<button class="btn btn-danger" type="button" data-cancel-sched="' + esc(x.id) + '">Avbryt<span class="visually-hidden"> ' + esc(x.subject) + "</span></button></div></li>";
    }).join("") + "</ul>";
  }
  document.getElementById("sched-list").addEventListener("click", function (e) {
    var c = e.target.closest("[data-cancel-sched]");
    var ed = e.target.closest("[data-edit-sched]");
    var id = (c || ed) && (c || ed).getAttribute(c ? "data-cancel-sched" : "data-edit-sched");
    if (!id) return;
    var item = store.mpScheduled().filter(function (x) { return x.id === id; })[0];
    if (!item) return;
    if (c) {
      if (!window.confirm("Avbryt utskicket ”" + item.subject + "”? Det sparas som utkast.")) return;
    }
    store.removeMpScheduled(id);
    store.saveMpDraft(item);
    load();
    if (ed) {
      document.getElementById("mp-later").checked = true;
      var d = new Date(item.sendAt);
      form.at.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    updateWhen();
    renderSched();
    form.subject.focus();
    toast(c ? "Utskicket är avbrutet och sparat som utkast." : "Utskicket ligger i formuläret – ändra och schemalägg igen.");
  });

  processDue();
  load();
  renderSubs();
  renderSched();
  renderSent();
  updateWhen();
})();
