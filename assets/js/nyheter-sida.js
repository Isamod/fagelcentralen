/* Visar nyheter: senaste på startsidan, listan på nyheter.html och en nyhet på nyhet.html. */
(function () {
  "use strict";
  var store = window.FCNyheter;
  if (!store) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    return /^(https?:\/\/|[a-z0-9][a-z0-9\-_.\/#?=&]*$)/i.test(u) && !/^javascript:/i.test(u) ? u : "";
  }

  function card(n) {
    var href = "nyhet.html?id=" + encodeURIComponent(n.id);
    return '<article class="news-card">' +
      (n.image ? '<div class="thumb' + (n.imageFit === "contain" ? " contain" : "") + '"><img loading="lazy" decoding="async" src="' +
        esc(store.imageSrc(n.image)) + '" alt="' + esc(n.imageAlt) + '"></div>' : "") +
      '<div class="body">' +
      '<p class="eyebrow" style="font-size:.6rem">' + esc(n.category || store.formatDate(n.date)) + "</p>" +
      "<h3>" + esc(n.title) + "</h3>" +
      "<p>" + esc(n.summary) + "</p>" +
      '<a class="arrow-link" href="' + href + '">Läs mer<span class="visually-hidden"> om ' + esc(n.title) + "</span></a>" +
      "</div></article>";
  }

  /* Startsidan: de tre senaste */
  var latest = document.querySelector("[data-news-latest]");
  if (latest) {
    var items = store.published().slice(0, 3);
    if (items.length) latest.innerHTML = items.map(card).join("");
    else latest.closest("section").hidden = true;
  }

  /* Alla nyheter */
  var list = document.querySelector("[data-news-list]");
  if (list) {
    var all = store.published();
    list.innerHTML = all.length ? all.map(card).join("")
      : '<p class="muted">Inga nyheter just nu.</p>';
  }

  /* En nyhet */
  var article = document.querySelector("[data-news-article]");
  if (article) {
    var id = new URLSearchParams(window.location.search).get("id");
    var n = id && store.get(id);
    if (!n || n.status !== "published") {
      article.innerHTML = "<h1>Nyheten finns inte</h1>" +
        '<p class="lead">Den kan ha tagits bort. <a href="nyheter.html">Se alla nyheter</a>.</p>';
      return;
    }
    document.title = n.title + " – Fågelcentralen";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", n.summary);
    var crumb = document.getElementById("article-crumb");
    if (crumb) crumb.textContent = n.title;
    var link = safeUrl(n.linkUrl);
    article.innerHTML =
      '<p class="eyebrow">' + esc(n.category) + (n.category ? " · " : "") + '<time datetime="' + esc(n.date) + '">' +
        esc(store.formatDate(n.date)) + "</time></p>" +
      "<h1>" + esc(n.title) + "</h1>" +
      '<p class="lead">' + esc(n.summary) + "</p>" +
      (n.image ? '<figure class="article-image' + (n.imageFit === "contain" ? " contain" : "") + '"><img src="' +
        esc(store.imageSrc(n.image)) + '" alt="' + esc(n.imageAlt) + '"></figure>' : "") +
      '<div class="article-body">' +
        String(n.body || "").split(/\n\s*\n/).map(function (p) {
          return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>";
        }).join("") +
      "</div>" +
      (link ? '<p><a class="btn" href="' + esc(link) + '">' + esc(n.linkText || "Läs mer") + " →</a></p>" : "") +
      '<p style="margin-top:40px"><a class="arrow-link" href="nyheter.html">Alla nyheter</a></p>';
  }
})();
