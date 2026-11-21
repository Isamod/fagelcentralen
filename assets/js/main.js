/* Fågelcentralen – gemensamt beteende för alla sidor */
(function () {
  "use strict";

  /* ---------- Webbplatsmeddelande (t.ex. intagningsstopp) ---------- */
  if (window.FCNyheter && !document.body.classList.contains("admin")) {
    var notice = window.FCNyheter.notice();
    if (notice.active && notice.text) {
      var bar = document.createElement("aside");
      bar.className = "site-notice";
      bar.setAttribute("aria-label", "Viktigt meddelande");
      var inner = document.createElement("div");
      inner.className = "container";
      var text = document.createElement("p");
      text.textContent = notice.text;
      inner.appendChild(text);
      var url = String(notice.linkUrl || "").trim();
      if (url && !/^javascript:/i.test(url)) {
        var a = document.createElement("a");
        a.href = url;
        a.textContent = (notice.linkText || "Läs mer") + " ";
        var arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "→";
        a.appendChild(arrow);
        inner.appendChild(a);
      }
      bar.appendChild(inner);
      var topbar = document.querySelector(".topbar");
      if (topbar) topbar.insertAdjacentElement("afterend", bar);
    }
  }

  /* ---------- Sidhuvud som följer med ----------
   Dator: följer alltid med (skugga när man scrollat).
   Mobil: gömmer sig vid scroll nedåt, visas direkt vid scroll uppåt.
   Gömmer sig aldrig när menyn är öppen eller fokus är i sidhuvudet. */
  var header = document.querySelector(".site-header");
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;
    var mobile = window.matchMedia("(max-width: 760px)");
    var update = function () {
      var y = window.scrollY;
      var navEl = header.querySelector(".main-nav");
      header.classList.toggle("is-scrolled", y > 40);
      if (!mobile.matches || (navEl && navEl.classList.contains("open")) || header.contains(document.activeElement) || y < 160) {
        header.classList.remove("is-hidden");
      } else if (y > lastY + 6) {
        header.classList.add("is-hidden");
      } else if (y < lastY - 6) {
        header.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
    update();
  }

  /* ---------- Mobilmeny ---------- */
  var nav = document.querySelector(".main-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Toast ---------- */
  var toastEl;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }
  window.FCToast = toast;

  /* ---------- Kopiera-knappar ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      var label = btn.getAttribute("data-copy-label") || "Numret";
      var done = function () { toast(label + " är kopierat: " + value); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done, function () { fallbackCopy(value); done(); });
      } else {
        fallbackCopy(value);
        done();
      }
    });
  });

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignorera */ }
    document.body.removeChild(ta);
  }

  /* ---------- Gåvoformulär (Stöd oss / Bli Fågelvän) ---------- */
  document.querySelectorAll("[data-donation]").forEach(initDonation);

  function initDonation(root) {
    var tabs = root.querySelectorAll("[role='tab']");
    var panels = root.querySelectorAll("[role='tabpanel']");

    function activate(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.hidden = p.id !== tab.getAttribute("aria-controls");
      });
      var panel = root.querySelector("#" + tab.getAttribute("aria-controls"));
      if (panel) updateSummary(panel);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { activate(tab); });
      tab.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        activate(next);
      });
    });

    panels.forEach(function (panel) {
      var radios = panel.querySelectorAll("input[type='radio']");
      var custom = panel.querySelector("input[data-custom-amount]");
      radios.forEach(function (r) {
        r.addEventListener("change", function () {
          if (custom) { custom.value = ""; clearError(custom); }
          updateSummary(panel);
        });
      });
      if (custom) {
        custom.addEventListener("input", function () {
          if (custom.value) radios.forEach(function (r) { r.checked = false; });
          clearError(custom);
          updateSummary(panel);
        });
      }
      var form = panel.querySelector("form");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var amount = currentAmount(panel);
          var min = Number(panel.getAttribute("data-min") || 1);
          if (!amount || amount < min) {
            if (custom) showError(custom, "Ange ett belopp på minst " + min + " kr.");
            return;
          }
          // Prototyp: här ska en Stripe Checkout-session skapas. Stripe skickar sedan
          // tillbaka givaren till tack.html. Tills dess går vi direkt dit i demoläge.
          var interval = panel.getAttribute("data-interval") === "month" ? "manad" : "engang";
          var tackUrl = "tack.html?typ=" + interval + "&belopp=" + amount + "&demo=1";
          var patient = panel.querySelector("input[name='patient']");
          if (patient && patient.checked) {
            tackUrl += "&patient=1";
            // Prototyp: visar kopplingen i admin. På riktigt sparas mottagaren
            // när Stripe bekräftat betalningen (namn och e-post kommer från Stripe).
            if (window.FCNyheter && window.FCNyheter.addSubscriber) {
              window.FCNyheter.addSubscriber({ namn: "Ny Fågelvän (demo)", email: "hämtas från Stripe", demo: true });
            }
          }
          window.location.href = tackUrl;
        });
      }
      updateSummary(panel);
    });
  }

  function currentAmount(panel) {
    var custom = panel.querySelector("input[data-custom-amount]");
    if (custom && custom.value) return Math.round(Number(custom.value.replace(",", ".")));
    var checked = panel.querySelector("input[type='radio']:checked");
    return checked ? Number(checked.value) : 0;
  }

  function formatAmount(n) {
    return n.toLocaleString("sv-SE") + " kr";
  }

  function updateSummary(panel) {
    var amount = currentAmount(panel);
    var monthly = panel.getAttribute("data-interval") === "month";
    var valueEl = panel.querySelector("[data-summary-value]");
    var btnEl = panel.querySelector("[data-summary-button]");
    var text = amount
      ? (monthly ? formatAmount(amount) + " varje månad" : formatAmount(amount) + " vid ett tillfälle")
      : "Välj ett belopp";
    if (valueEl) valueEl.textContent = text;
    if (btnEl) {
      var prefix = btnEl.getAttribute("data-prefix") || "Fortsätt";
      var suffix = monthly ? " kr/mån" : " kr";
      btnEl.textContent = amount ? prefix + " · " + amount.toLocaleString("sv-SE") + suffix : prefix;
    }
  }

  /* ---------- Formulärhjälp ---------- */
  function showError(input, message) {
    input.setAttribute("aria-invalid", "true");
    var id = input.id + "-error";
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("p");
      el.id = id;
      el.className = "error-msg";
      input.insertAdjacentElement("afterend", el);
    }
    el.textContent = message;
    var described = (input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    if (described.indexOf(id) === -1) described.push(id);
    input.setAttribute("aria-describedby", described.join(" "));
  }

  function clearError(input) {
    input.removeAttribute("aria-invalid");
    var el = document.getElementById(input.id + "-error");
    if (el) el.remove();
  }

  window.FCForm = { showError: showError, clearError: clearError };

  function escHtml(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Just nu hos oss (startsidan) ----------
     En kort smakbit. Hela berättelsen, Månadens patient, mejlas bara till Fågelvänner. */
  document.querySelectorAll("[data-patient]").forEach(function (el) {
    var p = window.FCNyheter && window.FCNyheter.patient();
    var section = el.closest("section") || el;
    if (!p || !p.active || !p.text) { section.hidden = true; return; }
    var img = p.image ? window.FCNyheter.imageSrc(p.image, el.getAttribute("data-prefix") || "") : "";
    el.innerHTML =
      (img ? '<div class="patient-media"><img loading="lazy" decoding="async" src="' + escHtml(img) + '" alt="' + escHtml(p.imageAlt) + '"></div>' : "") +
      '<div class="patient-body">' +
        '<p class="eyebrow">Just nu hos oss' + (p.species ? " · " + escHtml(p.species) : "") + "</p>" +
        "<h2>" + escHtml(p.name) + "</h2>" +
        '<p class="muted">' + escHtml(p.text) + "</p>" +
        (p.example ? '<p class="goal-note">Exempeltext – föreningen fyller i en riktig patient i administrationen.</p>' : "") +
        '<p class="patient-teaser">Vill du följa hela vägen tillbaka? Som Fågelvän får du <strong>Månadens patient</strong> i mejlet varje månad.</p>' +
        '<div class="btn-group"><a class="btn" href="stod-oss.html">Bli Fågelvän <span aria-hidden="true">→</span></a></div>' +
      "</div>";
  });

  /* ---------- Så används din gåva ---------- */
  document.querySelectorAll("[data-anvandning]").forEach(function (el) {
    var d = window.FCInsamling;
    if (!d || !d.anvandning || !d.anvandning.length) { (el.closest("section") || el).hidden = true; return; }
    el.innerHTML = d.anvandning.map(function (a) {
      return '<div class="use-item">' +
        (a.andel ? '<p class="use-share">' + escHtml(a.andel) + " %</p>" : "") +
        "<h3>" + escHtml(a.rubrik) + "</h3><p>" + escHtml(a.text) + "</p></div>";
    }).join("");
  });
  document.querySelectorAll("[data-faglar-i-ar]").forEach(function (el) {
    if (window.FCInsamling) el.textContent = window.FCInsamling.faglarIAr;
  });

  /* ---------- Dela ---------- */
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = new URL(btn.getAttribute("data-share"), window.location.href).href;
      var data = { title: "Fågelcentralen", text: btn.getAttribute("data-share-text") || "", url: url };
      var copied = function () { toast("Länken är kopierad – klistra in den där du vill dela."); };
      var copy = function () {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(copied, function () { fallbackCopy(url); copied(); });
        } else {
          fallbackCopy(url);
          copied();
        }
      };
      if (navigator.share) {
        navigator.share(data).catch(function (err) {
          if (!err || err.name !== "AbortError") copy();
        });
      } else {
        copy();
      }
    });
  });

  /* ---------- Partner och stödföretag ----------
     Läggs in under Administration → Partner. Visas i bokstavsordning, alla lika. */
  function partnerList() {
    var list = (window.FCNyheter && window.FCNyheter.partners()) || [];
    var extra = ((window.FCInsamling && window.FCInsamling.stodforetag) || []).map(function (c) {
      return { namn: c.namn, typ: "foretag", logga: c.logga, lank: c.lank };
    });
    return list.concat(extra);
  }
  function partnerItem(c, prefix) {
    var li = document.createElement("li");
    li.className = "partner-item" + (c.logga ? "" : " is-text") + (c.example ? " is-example" : "");
    var url = String(c.lank || "").trim();
    var inner = /^https?:\/\//.test(url) ? document.createElement("a") : document.createElement("span");
    if (inner.tagName === "A") { inner.href = url; inner.rel = "noopener"; }
    if (c.logga) {
      var img = document.createElement("img");
      img.src = window.FCNyheter ? window.FCNyheter.imageSrc(c.logga, prefix) : c.logga;
      img.alt = c.namn;
      img.loading = "lazy";
      inner.appendChild(img);
    } else {
      inner.textContent = c.example ? "Logotyp" : c.namn;
      if (c.example) inner.setAttribute("aria-label", c.namn + " (exempel)");
    }
    li.appendChild(inner);
    return li;
  }
  document.querySelectorAll("[data-partners]").forEach(function (section) {
    var only = section.getAttribute("data-partner-type");
    var prefix = section.getAttribute("data-prefix") || "";
    var all = partnerList().filter(function (c) { return !only || c.typ === only; });
    var groupsEl = section.querySelector("[data-partner-groups]");
    if (!all.length || !groupsEl) return;
    var groups = only ? [[only, null]] : [["partner", "Samarbetspartner"], ["foretag", "Stödföretag"]];
    groups.forEach(function (g) {
      var items = all.filter(function (c) { return c.typ === g[0]; }).sort(function (a, b) {
        return String(a.namn).localeCompare(String(b.namn), "sv");
      });
      if (!items.length) return;
      var wrap = document.createElement("div");
      wrap.className = "partner-group";
      if (g[1]) {
        var h = document.createElement("h3");
        h.textContent = g[1];
        wrap.appendChild(h);
      }
      var ul = document.createElement("ul");
      ul.className = "partner-grid";
      items.forEach(function (c) { ul.appendChild(partnerItem(c, prefix)); });
      wrap.appendChild(ul);
      groupsEl.appendChild(wrap);
    });
    var note = section.querySelector("[data-partner-note]");
    if (note) note.hidden = !all.some(function (c) { return c.example; });
    section.hidden = false;
  });

  /* ---------- Målmätare för Fågelvänner ---------- */
  var goal = window.FCFagelvanMal;
  document.querySelectorAll("[data-goal-meter]").forEach(function (el) {
    if (!goal) { el.hidden = true; return; }
    var pct = Math.max(0, Math.min(100, Math.round(goal.antal / goal.mal * 100)));
    var fmt = function (n) { return Number(n).toLocaleString("sv-SE"); };
    el.innerHTML =
      '<p class="goal-title">' + goal.rubrik + "</p>" +
      '<div class="goal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + goal.mal +
      '" aria-valuenow="' + goal.antal + '" aria-label="Antal Fågelvänner"><span style="width:' + pct + '%"></span></div>' +
      '<p class="goal-count"><strong>' + fmt(goal.antal) + " av " + fmt(goal.mal) + "</strong> har gått med</p>" +
      (goal.exempel ? '<p class="goal-note">Exempelsiffror – föreningen fyller i rätt mål och antal.</p>' : "");
  });
})();
