/* Volontärsidan: visar publicerade uppdrag och hanterar ansökningsformuläret. */
(function () {
  "use strict";

  var store = window.FCUppdrag;
  var listEl = document.getElementById("mission-list");
  var detailEl = document.getElementById("mission-detail");
  var select = document.getElementById("f-mission");
  var form = document.getElementById("volunteer-form");
  var success = document.getElementById("volunteer-success");
  if (!store || !listEl) return;

  var GENERAL = "allman";
  var missions = store.published();
  var selected = missions.length ? missions[0].id : GENERAL;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function metaLine(m) {
    return [m.placeShort || m.place, "På plats", m.form && m.form.replace(/ på plats$/, "")]
      .filter(Boolean).join(" · ");
  }

  function renderList() {
    if (!missions.length) {
      listEl.innerHTML = '<p class="muted">Just nu finns inga öppna uppdrag. Du kan fortfarande göra en allmän intresseanmälan nedan.</p>';
      return;
    }
    listEl.innerHTML = missions.map(function (m) {
      var isSel = m.id === selected;
      var label = (m.example ? "Exempeluppdrag" : "Volontäruppdrag") + (isSel ? " · Visas nedan" : "");
      return '<article class="mission-card' + (isSel ? " selected" : "") + '">' +
        '<p class="eyebrow" style="font-size:.6rem">' + esc(label) + "</p>" +
        "<h3>" + esc(m.title) + "</h3>" +
        '<p class="meta">' + esc(metaLine(m)) + "</p>" +
        '<p class="desc">' + esc(m.summary) + "</p>" +
        '<p class="extent">Omfattning och tider ' + esc(lowerFirst(m.extent)) + ".</p>" +
        '<a class="btn' + (isSel ? "" : " btn-light") + '" href="#ansokan" data-select-mission="' + esc(m.id) + '">' +
        (isSel ? "Läs uppdrag och ansök ↓" : "Läs mer och ansök →") + "</a>" +
        "</article>";
    }).join("");
  }

  function lowerFirst(s) {
    s = String(s || "");
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

  function renderDetail() {
    var m = missions.filter(function (x) { return x.id === selected; })[0];
    if (!m) {
      detailEl.innerHTML =
        '<p class="eyebrow">Allmän intresseanmälan</p>' +
        "<h2>Berätta hur du<br>vill bidra.</h2>" +
        '<p class="lead">Hittar du inget uppdrag som passar just nu? Skicka en allmän intresseanmälan så hör föreningen av sig när något passar.</p>' +
        "<h3>Bra att veta före ansökan</h3>" +
        "<p>Berätta vad du vill bidra med och när du har möjlighet. Lämna inga känsliga personuppgifter i ansökan.</p>";
      return;
    }
    detailEl.innerHTML =
      '<p class="eyebrow">Valt uppdrag' + (m.example ? " · Exempel" : "") + "</p>" +
      "<h2>" + esc(m.title) + "</h2>" +
      '<p class="lead">' + esc(m.lead || m.summary) + "</p>" +
      '<div class="facts"><p>Plats: ' + esc(m.place) + "</p><p>Omfattning: " + esc(m.extent) + "</p>" +
      (m.form ? "<p>Form: " + esc(m.form) + "</p>" : "") +
      (m.deadline ? "<p>Sista ansökningsdag: " + esc(m.deadline) + "</p>" : "") + "</div>" +
      "<h3>Det här kan du bidra med</h3>" +
      "<ul>" + (m.tasks || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      (m.requirements ? "<h3>Förkunskaper och förutsättningar</h3><p>" + esc(m.requirements) + "</p>" : "") +
      "<h3>Bra att veta före ansökan</h3>" +
      "<p>Exakta arbetsuppgifter, tider och eventuella förkunskaper beskrivs i varje publicerat uppdrag. Djurnära uppgifter sker bara enligt verksamhetens rutiner och handledning.</p>" +
      "<p>Berätta vad du vill bidra med och när du har möjlighet. Lämna inga känsliga personuppgifter i ansökan.</p>";
  }

  function renderSelect() {
    select.innerHTML = missions.map(function (m) {
      return '<option value="' + esc(m.id) + '">' + esc(m.title) + "</option>";
    }).join("") + '<option value="' + GENERAL + '">Allmän intresseanmälan</option>';
    select.value = selected;
  }

  function choose(id) {
    selected = id;
    renderList();
    renderDetail();
    select.value = id;
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-select-mission]");
    if (link) choose(link.getAttribute("data-select-mission"));
  });

  select.addEventListener("change", function () { choose(select.value); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    var first = null;
    var checks = [
      ["f-name", function (v) { return v.trim().length > 1; }, "Skriv ditt namn."],
      ["f-email", function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, "Skriv en giltig e-postadress."],
      ["f-why", function (v) { return v.trim().length > 0; }, "Berätta kort varför du vill bli volontär."]
    ];
    checks.forEach(function (c) {
      var input = document.getElementById(c[0]);
      if (c[1](input.value)) {
        window.FCForm.clearError(input);
      } else {
        ok = false;
        window.FCForm.showError(input, c[2]);
        if (!first) first = input;
      }
    });
    if (!ok) { first.focus(); return; }

    var data = new FormData(form);
    store.addApplication({
      mission: data.get("mission"),
      name: data.get("name"),
      phone: data.get("phone"),
      email: data.get("email"),
      why: data.get("why"),
      when: data.get("when")
    });
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  renderList();
  renderDetail();
  renderSelect();
})();
