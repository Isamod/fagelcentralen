/*
 * Datalager för volontäruppdrag.
 *
 * Prototyp: uppdrag och ansökningar sparas i webbläsarens localStorage,
 * så att adminsidan och volontärsidan kan visas tillsammans utan server.
 * Byt ut funktionerna nedan mot API-anrop när en riktig backend finns.
 */
(function () {
  "use strict";

  var KEY_MISSIONS = "fc.uppdrag.v1";
  var KEY_APPLICATIONS = "fc.ansokningar.v1";

  var DEFAULT_MISSIONS = [
    {
      id: "praktiskt-stod",
      title: "Praktiskt stöd på anläggningen",
      summary: "Bidra med praktiska förberedelser och ordning i verksamheten, tillsammans med ansvarig på plats.",
      lead: "För dig som vill bidra med tid, omtanke och ett praktiskt handtag i vardagen.",
      tasks: [
        "Förbereda material och hålla ordning.",
        "Hjälpa till med praktiska sysslor på anläggningen.",
        "Arbeta tillsammans med ansvarig i verksamheten."
      ],
      requirements: "",
      place: "Tullare Hög 50, Kungälv",
      placeShort: "Kungälv",
      extent: "Enligt överenskommelse",
      form: "Ideellt uppdrag på plats",
      deadline: "",
      recipient: "volontar",
      status: "published",
      example: true
    },
    {
      id: "voljarer-utemiljo",
      title: "Underhåll av voljärer och utemiljö",
      summary: "Använd ditt praktiska handlag till skötsel och enklare underhåll av anläggningens miljöer.",
      lead: "För dig som tycker om att arbeta med händerna och vill göra skillnad utomhus.",
      tasks: [
        "Enklare underhåll av voljärer.",
        "Skötsel av utemiljön runt anläggningen.",
        "Arbeta tillsammans med ansvarig i verksamheten."
      ],
      requirements: "",
      place: "Tullare Hög 50, Kungälv",
      placeShort: "Kungälv",
      extent: "Enligt överenskommelse",
      form: "Ideellt uppdrag på plats",
      deadline: "",
      recipient: "volontar",
      status: "published",
      example: true
    },
    {
      id: "kommunikation-insamling",
      title: "Kommunikation och insamling",
      summary: "Bidra med text och kommunikation som gör föreningens arbete synligt.",
      lead: "För dig som vill berätta om föreningens arbete.",
      tasks: [
        "Beskriv vad volontären ska hjälpa till med och vem som ger stöd i arbetet. Skilj på självständiga uppgifter och sådant som kräver handledning."
      ],
      requirements: "Ange endast krav som faktiskt behövs för uppdraget.",
      place: "Kungälv",
      placeShort: "Kungälv",
      extent: "Enligt överenskommelse",
      form: "Ideellt uppdrag",
      deadline: "",
      recipient: "",
      status: "draft",
      example: true
    }
  ];

  var RECIPIENTS = [
    { id: "volontar", label: "Volontäransvarig" },
    { id: "styrelse", label: "Styrelsen" }
  ];

  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/[åä]/g, "a").replace(/ö/g, "o")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "uppdrag";
  }

  var store = {
    RECIPIENTS: RECIPIENTS,

    all: function () { return read(KEY_MISSIONS, clone(DEFAULT_MISSIONS)); },

    published: function () {
      return store.all().filter(function (m) { return m.status === "published"; });
    },

    get: function (id) {
      return store.all().filter(function (m) { return m.id === id; })[0] || null;
    },

    save: function (mission) {
      var list = store.all();
      if (!mission.id) {
        var base = slugify(mission.title), id = base, i = 2;
        while (list.some(function (m) { return m.id === id; })) { id = base + "-" + i++; }
        mission.id = id;
        list.push(mission);
      } else {
        var found = false;
        list = list.map(function (m) {
          if (m.id === mission.id) { found = true; return mission; }
          return m;
        });
        if (!found) list.push(mission);
      }
      write(KEY_MISSIONS, list);
      return mission;
    },

    setStatus: function (id, status) {
      var m = store.get(id);
      if (!m) return null;
      m.status = status;
      return store.save(m);
    },

    reset: function () {
      try {
        window.localStorage.removeItem(KEY_MISSIONS);
        window.localStorage.removeItem(KEY_APPLICATIONS);
      } catch (e) { /* ignorera */ }
    },

    applications: function () { return read(KEY_APPLICATIONS, []); },

    removeApplication: function (receivedAt) {
      write(KEY_APPLICATIONS, store.applications().filter(function (a) { return a.receivedAt !== receivedAt; }));
    },

    addApplication: function (app) {
      var list = store.applications();
      app.receivedAt = new Date().toISOString();
      list.push(app);
      write(KEY_APPLICATIONS, list);
      return app;
    }
  };

  window.FCUppdrag = store;
})();
