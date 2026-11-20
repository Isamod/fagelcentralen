/*
 * Datalager för nyheter och webbplatsmeddelande.
 *
 * Prototyp: sparas i webbläsarens localStorage. Byt ut funktionerna mot
 * API-anrop när en riktig backend finns (samma gränssnitt som uppdrag.js).
 */
(function () {
  "use strict";

  var KEY_NEWS = "fc.nyheter.v1";
  var KEY_NOTICE = "fc.meddelande.v1";

  var DEFAULT_NEWS = [
    {
      id: "kalender-2027",
      title: "Fågelcentralens kalender 2027",
      category: "Kalender · 2027",
      date: "2026-11-01",
      summary: "Upptäck kalendern för 2027 med hotade fågelarter och stötta Fågelcentralens arbete.",
      body: "Upptäck kalendern för 2027 med hotade fågelarter och stötta Fågelcentralens arbete.\n\nExempeltext – ersätt med riktig information om pris, hur man beställer och när kalendern skickas.",
      image: "assets/img/kalender-2027.jpg",
      imageAlt: "Omslaget till Fågelcentralens kalender 2027.",
      imageFit: "contain",
      linkUrl: "",
      linkText: "",
      status: "published",
      example: true
    },
    {
      id: "forelasningar-medborgarskolan",
      title: "Föreläsningar med Medborgarskolan",
      category: "Kunskap · Samarbete",
      date: "2026-10-15",
      summary: "Nyfiken på hur vårt arbete går till? Läs om föreläsningarna i samarbete med Medborgarskolan.",
      body: "Nyfiken på hur vårt arbete går till? Tillsammans med Medborgarskolan håller vi föreläsningar om vilda fåglar och viltrehabilitering.\n\nExempeltext – ersätt med datum, plats och hur man anmäler sig.",
      image: "assets/img/rovfagel.jpg",
      imageAlt: "Närbild på en rovfågel.",
      imageFit: "cover",
      linkUrl: "",
      linkText: "",
      status: "published",
      example: true
    },
    {
      id: "bidra-med-din-tid",
      title: "Bidra med din tid hos oss",
      category: "Engagera dig",
      date: "2026-10-01",
      summary: "Vill du hjälpa till i verksamheten? Läs om volontärarbetet och hur du anmäler ditt intresse.",
      body: "Vill du hjälpa till i verksamheten? Vi söker volontärer till flera olika uppdrag – både praktiskt arbete på anläggningen och kommunikation.\n\nLäs om de aktuella uppdragen och skicka din ansökan direkt på volontärsidan.",
      image: "assets/img/volontar.jpg",
      imageAlt: "En volontär släpper en rovfågel som breder ut vingarna.",
      imageFit: "cover",
      linkUrl: "volontar.html",
      linkText: "Se volontäruppdragen",
      status: "published",
      example: true
    }
  ];

  var DEFAULT_NOTICE = { active: false, text: "", linkUrl: "", linkText: "" };

  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function slugify(text) {
    return String(text).toLowerCase()
      .replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/é/g, "e")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "nyhet";
  }
  function byDate(a, b) { return (b.date || "").localeCompare(a.date || ""); }

  var store = {
    all: function () { return read(KEY_NEWS, clone(DEFAULT_NEWS)).sort(byDate); },
    published: function () { return store.all().filter(function (n) { return n.status === "published"; }); },
    get: function (id) { return store.all().filter(function (n) { return n.id === id; })[0] || null; },

    /* Sparar nyheten. Returnerar false om webbläsarens lagring är full (t.ex. för stora bilder). */
    save: function (item) {
      var list = store.all();
      if (!item.id) {
        var base = slugify(item.title), id = base, i = 2;
        while (list.some(function (n) { return n.id === id; })) { id = base + "-" + i++; }
        item.id = id;
        list.push(item);
      } else {
        var found = false;
        list = list.map(function (n) { if (n.id === item.id) { found = true; return item; } return n; });
        if (!found) list.push(item);
      }
      return write(KEY_NEWS, list) ? item : false;
    },

    remove: function (id) {
      write(KEY_NEWS, store.all().filter(function (n) { return n.id !== id; }));
    },

    notice: function () { return read(KEY_NOTICE, clone(DEFAULT_NOTICE)); },
    saveNotice: function (n) { return write(KEY_NOTICE, n); },

    reset: function () {
      try { window.localStorage.removeItem(KEY_NEWS); } catch (e) { /* ignorera */ }
    },

    formatDate: function (iso) {
      if (!iso) return "";
      var d = new Date(iso + "T12:00:00");
      return isNaN(d) ? iso : d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
    },

    /* Bildadress relativt sidan som visar den (admin ligger en mapp ner). */
    imageSrc: function (src, prefix) {
      if (!src) return "";
      if (/^(data:|https?:|\/)/.test(src)) return src;
      return (prefix || "") + src;
    }
  };

  window.FCNyheter = store;
})();
