/*
 * Påminnelse i admin: Månadens patient ska skickas senast månadens sista dag.
 * Från tre dagar före sista dagen visas en banner om månadens mejl varken är
 * skickat eller schemalagt. Den kan kryssas bort, men kommer tillbaka vid nästa
 * inloggning (i prototypen: nästa gång webbläsaren öppnas) tills mejlet är klart.
 *
 * För att visa bannern ett annat datum: lägg till ?idag=2026-11-28 i adressen.
 */
(function () {
  "use strict";
  var store = window.FCNyheter;
  var nav = document.querySelector(".admin-nav");
  if (!store || !nav || !store.mpSent) return;

  var param = new URLSearchParams(window.location.search).get("idag");
  var today = param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? new Date(param + "T12:00:00") : new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var lastDay = new Date(year, month + 1, 0).getDate();
  if (today.getDate() < lastDay - 3) return;

  function inThisMonth(iso) {
    var d = new Date(iso);
    return d.getFullYear() === year && d.getMonth() === month;
  }
  var done = store.mpSent().some(function (x) { return inThisMonth(x.sentAt); }) ||
             store.mpScheduled().some(function (x) { return inThisMonth(x.sendAt); });
  if (done) return;

  var key = "fc.paminnelse." + year + "-" + (month + 1);
  try { if (window.sessionStorage.getItem(key)) return; } catch (e) { /* visa ändå */ }

  var monthName = today.toLocaleDateString("sv-SE", { month: "long" });
  var daysLeft = lastDay - today.getDate();
  var date = lastDay + " " + today.toLocaleDateString("sv-SE", { month: "long" });
  var when = daysLeft === 0 ? "Sista dagen att skicka är i dag."
    : daysLeft === 1 ? "Sista dagen att skicka är i morgon, " + date + "."
    : "Sista dagen att skicka är " + date + " – om " + daysLeft + " dagar.";
  var onPage = /manadens-patient\.html$/.test(window.location.pathname);

  var bar = document.createElement("aside");
  bar.className = "admin-reminder";
  bar.setAttribute("aria-label", "Påminnelse");
  bar.innerHTML =
    '<div class="container">' +
      '<p><strong>Månadens patient för ' + monthName + " är inte skickad.</strong> " +
      when + "</p>" +
      (onPage ? "" : '<a class="btn" href="manadens-patient.html">Skriv och schemalägg</a>') +
      '<button type="button" class="admin-reminder-close" aria-label="Stäng påminnelsen">×</button>' +
    "</div>";
  nav.insertAdjacentElement("afterend", bar);
  bar.querySelector(".admin-reminder-close").addEventListener("click", function () {
    try { window.sessionStorage.setItem(key, "1"); } catch (e) { /* ignorera */ }
    bar.remove();
  });
})();
