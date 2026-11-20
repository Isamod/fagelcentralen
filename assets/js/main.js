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
          if (patient && patient.checked) tackUrl += "&patient=1";
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
