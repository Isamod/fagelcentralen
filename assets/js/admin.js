/* Administration av volontäruppdrag (prototyp med localStorage). */
(function () {
  "use strict";

  var store = window.FCUppdrag;
  var toast = window.FCToast;
  var formHelp = window.FCForm;

  var rowsEl = document.getElementById("mission-rows");
  var editor = document.getElementById("editor");
  var form = document.getElementById("mission-form");
  var recipient = document.getElementById("m-recipient");
  var publishBtn = document.getElementById("publish");
  var saveBtn = document.getElementById("save-draft");
  var dialog = document.getElementById("preview-dialog");

  var STATUS = { published: "Publicerat", draft: "Utkast", closed: "Stängt" };
  var REQUIRED = ["m-title", "m-summary", "m-tasks", "m-place", "m-extent"];

  var editing = null; // uppdraget som redigeras (kopia)

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  store.RECIPIENTS.forEach(function (r) {
    var o = document.createElement("option");
    o.value = r.id;
    o.textContent = r.label;
    recipient.appendChild(o);
  });

  /* ---------- Tabell ---------- */
  function renderRows() {
    var list = store.all();
    rowsEl.innerHTML = list.map(function (m) {
      var isEditing = editing && editing.id === m.id;
      var status = STATUS[m.status] + (isEditing ? " · redigeras" : "");
      var actions = isEditing
        ? '<button class="btn btn-light" type="button" disabled aria-disabled="true">Redigeras</button>'
        : '<button class="btn btn-light" type="button" data-edit="' + esc(m.id) + '">Redigera</button>';
      if (m.status === "published") {
        actions += '<button class="btn btn-light" type="button" data-close="' + esc(m.id) + '">Stäng</button>';
      } else if (m.status === "closed") {
        actions += '<button class="btn btn-light" type="button" data-reopen="' + esc(m.id) + '">Öppna igen</button>';
      }
      return '<tr' + (isEditing ? ' class="is-editing"' : "") + ">" +
        '<td><p class="m-title">' + esc(m.title || "Namnlöst uppdrag") + "</p>" +
        '<p class="m-meta">' + (m.example ? "Exempeluppdrag · " : "") + esc(m.placeShort || m.place || "Plats saknas") + "</p></td>" +
        '<td class="m-status">' + esc(status) + "</td>" +
        '<td><div class="row-actions">' + actions + "</div></td></tr>";
    }).join("");
    updateCounts();
  }

  function updateCounts() {
    var apps = store.applications();
    setCount("missions", store.all().length);
    setCount("apps", apps.filter(function (a) { return a.mission !== "allman"; }).length);
    setCount("general", apps.filter(function (a) { return a.mission === "allman"; }).length);
  }
  function setCount(key, n) {
    document.querySelectorAll('[data-count="' + key + '"]').forEach(function (el) { el.textContent = n; });
  }

  rowsEl.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.edit) openEditor(store.get(b.dataset.edit));
    if (b.dataset.close) {
      store.setStatus(b.dataset.close, "closed");
      toast("Uppdraget är stängt och syns inte längre på webbplatsen.");
      if (editing && editing.id === b.dataset.close) editing.status = "closed";
      renderRows(); updatePublishState();
    }
    if (b.dataset.reopen) openEditor(store.get(b.dataset.reopen));
  });

  /* ---------- Redigering ---------- */
  function openEditor(m) {
    editing = JSON.parse(JSON.stringify(m));
    document.getElementById("editor-heading").textContent =
      !m.id ? "Nytt uppdrag" : m.status === "draft" ? "Redigera utkast" : "Redigera uppdrag";
    document.getElementById("editor-title").textContent = m.title || "Nytt uppdrag";
    document.getElementById("editor-sub").textContent = m.example
      ? "Uppgifterna nedan är exempeltext för utkastet."
      : "Fyll i uppgifterna nedan.";
    field("m-title").value = m.title || "";
    field("m-summary").value = m.summary || "";
    field("m-tasks").value = (m.tasks || []).join("\n");
    field("m-req").value = m.requirements || "";
    field("m-place").value = m.place || "";
    field("m-extent").value = m.extent || "";
    field("m-deadline").value = m.deadline || "";
    recipient.value = m.recipient || "";
    REQUIRED.concat("m-recipient").forEach(function (id) { formHelp.clearError(field(id)); });
    editor.hidden = false;
    renderRows();
    updatePublishState();
  }

  function field(id) { return document.getElementById(id); }

  function readForm() {
    var place = field("m-place").value.trim();
    editing.title = field("m-title").value.trim();
    editing.summary = field("m-summary").value.trim();
    editing.tasks = field("m-tasks").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    editing.requirements = field("m-req").value.trim();
    editing.place = place;
    editing.placeShort = place.split(",").pop().trim();
    editing.extent = field("m-extent").value.trim();
    editing.deadline = field("m-deadline").value.trim();
    editing.recipient = recipient.value;
    editing.form = editing.form || "Ideellt uppdrag på plats";
    editing.lead = editing.lead || editing.summary;
    return editing;
  }

  function missing() {
    return REQUIRED.concat("m-recipient").filter(function (id) { return !field(id).value.trim(); });
  }

  function updatePublishState() {
    if (!editing) return;
    var status = editing.status;
    var ready = missing().length === 0;
    document.getElementById("pub-status").textContent = "Status · " + STATUS[status];
    document.getElementById("pub-text").textContent =
      status === "published" ? "Det här uppdraget syns på webbplatsen och går att söka."
        : status === "closed" ? "Uppdraget är stängt och går inte att söka."
        : "Det här uppdraget syns inte på webbplatsen ännu.";
    document.getElementById("pub-hint").textContent = ready
      ? "Allt obligatoriskt är ifyllt."
      : "Fyll i mottagare och obligatoriska fält före publicering.";
    saveBtn.textContent = status === "published" ? "Spara ändringar" : "Spara utkast";
    publishBtn.textContent = status === "published" ? "Publicerat" : status === "closed" ? "Publicera igen" : "Publicera uppdrag";
    publishBtn.disabled = status === "published";
    publishBtn.classList.toggle("is-muted", !ready && status !== "published");
  }

  form.addEventListener("input", function (e) {
    if (e.target.id === "m-title") {
      document.getElementById("editor-title").textContent = e.target.value || "Nytt uppdrag";
    }
    if (e.target.getAttribute("aria-invalid") && e.target.value.trim()) formHelp.clearError(e.target);
    updatePublishState();
  });
  recipient.addEventListener("change", function () {
    if (recipient.value) formHelp.clearError(recipient);
    updatePublishState();
  });

  saveBtn.addEventListener("click", function () {
    if (!editing) return;
    readForm();
    if (!editing.title) {
      formHelp.showError(field("m-title"), "Ge uppdraget en rubrik.");
      field("m-title").focus();
      return;
    }
    if (editing.status === "published" && missing().length) {
      showMissing();
      return;
    }
    store.save(editing);
    toast(editing.status === "published" ? "Ändringarna är sparade och publicerade." : "Utkastet är sparat.");
    renderRows(); updatePublishState();
  });

  publishBtn.addEventListener("click", function () {
    if (!editing) return;
    readForm();
    if (missing().length) { showMissing(); return; }
    editing.status = "published";
    store.save(editing);
    toast("Uppdraget är publicerat på webbplatsen.");
    renderRows(); updatePublishState();
  });

  function showMissing() {
    var ids = missing();
    ids.forEach(function (id) {
      var label = document.querySelector('label[for="' + id + '"]');
      var text = label ? label.textContent.replace(" *", "") : "Fältet";
      formHelp.showError(field(id), text + " måste fyllas i.");
    });
    field(ids[0]).focus();
  }

  document.getElementById("new-mission").addEventListener("click", function () {
    openEditor({ id: "", title: "", summary: "", tasks: [], requirements: "", place: "", extent: "",
      deadline: "", recipient: "", status: "draft", example: false });
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
    field("m-title").focus({ preventScroll: true });
  });

  /* ---------- Förhandsgranskning ---------- */
  document.getElementById("preview").addEventListener("click", function () {
    if (!editing) return;
    var m = readForm();
    document.getElementById("preview-body").innerHTML =
      '<h2 id="preview-title">' + esc(m.title || "Namnlöst uppdrag") + "</h2>" +
      '<p class="lead">' + esc(m.summary) + "</p>" +
      '<div class="facts"><p>Plats: ' + esc(m.place) + "</p><p>Omfattning: " + esc(m.extent) + "</p>" +
      (m.deadline ? "<p>Sista ansökningsdag: " + esc(m.deadline) + "</p>" : "") + "</div>" +
      "<h3>Det här kan du bidra med</h3><ul>" +
      m.tasks.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      (m.requirements ? "<h3>Förkunskaper och förutsättningar</h3><p>" + esc(m.requirements) + "</p>" : "");
    if (typeof dialog.showModal === "function") dialog.showModal();
  });
  document.getElementById("close-preview").addEventListener("click", function () { dialog.close(); });

  /* ---------- Flikar ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".admin-tabs [role='tab']"));
  function activate(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (tab.id === "tab-apps") renderApps("apps-list", false);
    if (tab.id === "tab-general") renderApps("general-list", true);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { activate(tab); });
    tab.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus(); activate(next);
    });
  });

  function renderApps(targetId, general) {
    var target = document.getElementById(targetId);
    var apps = store.applications().filter(function (a) { return (a.mission === "allman") === general; });
    if (!apps.length) {
      target.innerHTML = '<div class="empty">' +
        (general ? "Inga allmänna intresseanmälningar ännu." : "Inga ansökningar ännu.") + "</div>";
      return;
    }
    target.innerHTML = apps.slice().reverse().map(function (a) {
      var m = store.get(a.mission);
      var date = new Date(a.receivedAt).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
      return '<article class="app-card"><h3>' + esc(a.name) + "</h3>" +
        '<p class="tiny muted" style="margin:0">' + esc(general ? "Allmän intresseanmälan" : (m ? m.title : a.mission)) + " · " + esc(date) + "</p>" +
        "<dl><dt>E-post</dt><dd><a href=\"mailto:" + esc(a.email) + '">' + esc(a.email) + "</a></dd>" +
        (a.phone ? "<dt>Telefon</dt><dd>" + esc(a.phone) + "</dd>" : "") +
        "<dt>Varför</dt><dd>" + esc(a.why) + "</dd>" +
        (a.when ? "<dt>Kan hjälpa till</dt><dd>" + esc(a.when) + "</dd>" : "") +
        "</dl></article>";
    }).join("");
  }

  /* ---------- Återställ ---------- */
  document.getElementById("reset-demo").addEventListener("click", function () {
    if (!window.confirm("Återställ exempeldata? Uppdrag och ansökningar som sparats i den här webbläsaren tas bort.")) return;
    store.reset();
    editing = null;
    start();
    toast("Exempeldata är återställd.");
  });

  /* ---------- Start ---------- */
  function start() {
    var draft = store.all().filter(function (m) { return m.status === "draft"; })[0];
    if (draft) openEditor(draft);
    else { editor.hidden = true; renderRows(); }
  }
  start();
})();
