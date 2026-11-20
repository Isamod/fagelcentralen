/* Administration av nyheter (prototyp med localStorage). */
(function () {
  "use strict";

  var store = window.FCNyheter;
  var toast = window.FCToast;
  var formHelp = window.FCForm;

  var listEl = document.getElementById("news-list");
  var editor = document.getElementById("news-editor");
  var form = document.getElementById("news-form");
  var fileInput = document.getElementById("a-image");
  var preview = document.getElementById("a-image-preview");
  var removeImg = document.getElementById("a-image-remove");
  var REQUIRED = ["a-title", "a-date", "a-summary", "a-body"];

  var editing = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function field(id) { return document.getElementById(id); }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------- Lista ---------- */
  function renderList() {
    var items = store.all();
    if (!items.length) {
      listEl.innerHTML = '<div class="empty">Inga nyheter ännu. Klicka på ”Skriv ny nyhet”.</div>';
      return;
    }
    listEl.innerHTML = items.map(function (n) {
      var isEditing = editing && editing.id === n.id;
      var draft = n.status !== "published";
      return '<article class="news-row' + (isEditing ? " is-editing" : "") + '">' +
        '<div class="thumb">' + (n.image ? '<img src="' + esc(store.imageSrc(n.image, "../")) + '" alt="">' : "") + "</div>" +
        "<div><h2>" + esc(n.title || "Namnlös nyhet") +
          '<span class="badge' + (draft ? " draft" : "") + '">' + (draft ? "Utkast" : "Publicerad") + "</span></h2>" +
          "<p>" + esc(store.formatDate(n.date)) + (n.category ? " · " + esc(n.category) : "") + (n.example ? " · Exempel" : "") + "</p></div>" +
        '<div class="row-actions">' +
          (isEditing ? '<button class="btn btn-light" type="button" disabled>Redigeras</button>'
                     : '<button class="btn btn-light" type="button" data-edit="' + esc(n.id) + '">Redigera</button>') +
          (!draft ? '<a class="btn btn-light" href="../nyhet.html?id=' + encodeURIComponent(n.id) + '" target="_blank" rel="noopener">Visa <span aria-hidden=true>↗</span></a>' : "") +
        "</div></article>";
    }).join("");
  }

  listEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-edit]");
    if (b) {
      openEditor(store.get(b.getAttribute("data-edit")));
      editor.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  });

  /* ---------- Redigering ---------- */
  function openEditor(n) {
    editing = JSON.parse(JSON.stringify(n));
    field("news-editor-heading").textContent = n.id ? "Redigera nyhet" : "Ny nyhet";
    field("a-title").value = n.title || "";
    field("a-category").value = n.category || "";
    field("a-date").value = n.date || today();
    field("a-summary").value = n.summary || "";
    field("a-body").value = n.body || "";
    field("a-alt").value = n.imageAlt || "";
    field("a-link").value = n.linkUrl || "";
    field("a-linktext").value = n.linkText || "";
    fileInput.value = "";
    showImage(n.image);
    REQUIRED.forEach(function (id) { formHelp.clearError(field(id)); });
    editor.hidden = false;
    renderList();
    updateStatus();
  }

  function showImage(src) {
    if (src) {
      preview.querySelector("img").src = store.imageSrc(src, "../");
      preview.hidden = false;
      removeImg.hidden = false;
    } else {
      preview.hidden = true;
      removeImg.hidden = true;
    }
  }

  function updateStatus() {
    var published = editing.status === "published";
    var saved = !!editing.id;
    field("news-status").textContent = "Status · " + (published ? "Publicerad" : "Utkast");
    field("news-status-text").textContent = published
      ? "Nyheten syns på webbplatsen."
      : "Nyheten syns inte på webbplatsen ännu.";
    field("news-save").textContent = published ? "Spara ändringar" : "Spara utkast";
    field("news-publish").hidden = published;
    field("news-unpublish").hidden = !published;
    field("news-delete").hidden = !saved;
  }

  function readForm() {
    editing.title = field("a-title").value.trim();
    editing.category = field("a-category").value.trim();
    editing.date = field("a-date").value;
    editing.summary = field("a-summary").value.trim();
    editing.body = field("a-body").value.trim();
    editing.imageAlt = field("a-alt").value.trim();
    editing.linkUrl = field("a-link").value.trim();
    editing.linkText = field("a-linktext").value.trim();
    editing.imageFit = editing.imageFit || "cover";
  }

  function validate(all) {
    var ids = all ? REQUIRED : ["a-title"];
    var bad = ids.filter(function (id) { return !field(id).value.trim(); });
    ids.forEach(function (id) { formHelp.clearError(field(id)); });
    bad.forEach(function (id) {
      var label = document.querySelector('label[for="' + id + '"]').textContent.replace(" *", "");
      formHelp.showError(field(id), label + " måste fyllas i.");
    });
    if (bad.length) field(bad[0]).focus();
    return !bad.length;
  }

  function persist(message) {
    if (store.save(editing) === false) {
      toast("Kunde inte spara – bilden är troligen för stor. Prova en mindre bild.");
      return false;
    }
    toast(message);
    renderList();
    updateStatus();
    return true;
  }

  field("news-save").addEventListener("click", function () {
    readForm();
    var needAll = editing.status === "published";
    if (!validate(needAll)) return;
    persist(needAll ? "Ändringarna är publicerade." : "Utkastet är sparat.");
  });

  field("news-publish").addEventListener("click", function () {
    readForm();
    if (!validate(true)) return;
    var prev = editing.status;
    editing.status = "published";
    if (!persist("Nyheten är publicerad.")) editing.status = prev;
  });

  field("news-unpublish").addEventListener("click", function () {
    readForm();
    editing.status = "draft";
    persist("Nyheten är avpublicerad och syns inte längre.");
  });

  field("news-delete").addEventListener("click", function () {
    if (!editing.id) return;
    if (!window.confirm("Ta bort ”" + (editing.title || "nyheten") + "”? Det går inte att ångra.")) return;
    store.remove(editing.id);
    editing = null;
    editor.hidden = true;
    renderList();
    toast("Nyheten är borttagen.");
  });

  form.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") && e.target.value.trim()) formHelp.clearError(e.target);
  });

  /* ---------- Bild: förminska i webbläsaren ---------- */
  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast("Välj en bildfil."); fileInput.value = ""; return; }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1200;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        editing.image = canvas.toDataURL("image/jpeg", 0.8);
        editing.imageFit = "cover";
        showImage(editing.image);
        if (!field("a-alt").value.trim()) field("a-alt").focus();
      };
      img.onerror = function () { toast("Bilden kunde inte läsas."); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  removeImg.addEventListener("click", function () {
    editing.image = "";
    fileInput.value = "";
    showImage("");
  });

  /* ---------- Ny / återställ ---------- */
  field("new-news").addEventListener("click", function () {
    openEditor({ id: "", title: "", category: "", date: today(), summary: "", body: "", image: "",
      imageAlt: "", imageFit: "cover", linkUrl: "", linkText: "", status: "draft", example: false });
    editor.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    field("a-title").focus({ preventScroll: true });
  });

  field("reset-news").addEventListener("click", function () {
    if (!window.confirm("Återställ exempelnyheterna? Nyheter du har skrivit i den här webbläsaren tas bort.")) return;
    store.reset();
    editing = null;
    editor.hidden = true;
    renderList();
    toast("Exempelnyheterna är återställda.");
  });

  renderList();
})();
