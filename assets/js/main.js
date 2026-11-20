/* Fågelcentralen – gemensamt beteende för alla sidor */
(function () {
  "use strict";

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
          toast("Här skickas du vidare till kortbetalning (" + formatAmount(amount) + ").");
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
})();
