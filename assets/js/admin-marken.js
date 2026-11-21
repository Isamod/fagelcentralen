/* Märken för stödföretag: ritar märke, bild för sociala medier och diplom på canvas. */
(function () {
  "use strict";
  var GREEN = "#163f35";
  var CREAM = "#f7f6f1";
  var SAGE = "#e6ebe4";
  var GOLD = "#e7b04a";
  var MUTED = "#4f5e59";
  var SITE = "https://fagelcentralen.se/foretag.html";

  var form = document.getElementById("badge-form");
  var logo = new Image();
  logo.src = "../assets/img/logo-mark.svg";

  function opts() {
    var y = parseInt(form.year.value, 10);
    return {
      year: y >= 2020 && y <= 2100 ? String(y) : String(new Date().getFullYear() + 1),
      pf: form.level.value === "pf",
      company: form.company.value.trim()
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function spaced(ctx, px) { if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px"; }
  function fit(ctx, text, font, size, maxWidth) {
    var s = size;
    do { ctx.font = font.replace("{s}", s); s -= 2; } while (ctx.measureText(text).width > maxWidth && s > 10);
  }
  function wrap(ctx, text, maxWidth) {
    var words = text.split(" "), lines = [], line = "";
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else { line = test; }
    });
    if (line) lines.push(line);
    return lines;
  }

  /* ---------- Märke 720×240 ---------- */
  function goldGradient(ctx, x0, y0, x1, y1) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "#f6dc9a");
    g.addColorStop(0.55, GOLD);
    g.addColorStop(1, "#c98f2a");
    return g;
  }
  function pill(ctx, text, x, y, bg, fg) {
    ctx.font = "700 20px Inter, sans-serif";
    spaced(ctx, 3);
    var w = ctx.measureText(text).width + 32;
    roundRect(ctx, x, y - 26, w, 36, 18);
    ctx.fillStyle = bg; ctx.fill();
    ctx.fillStyle = fg;
    ctx.fillText(text, x + 16, y - 1);
    spaced(ctx, 0);
    return w;
  }
  function drawBadge(canvas, dark) {
    var o = opts(), ctx = canvas.getContext("2d"), W = 720, H = 240;
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";
    roundRect(ctx, 4, 4, W - 8, H - 8, 32);
    if (o.pf) {
      ctx.fillStyle = dark ? GREEN : goldGradient(ctx, 0, 0, W, H);
      ctx.fill();
      ctx.lineWidth = dark ? 10 : 5;
      ctx.strokeStyle = dark ? goldGradient(ctx, 0, 0, W, H) : GREEN;
      ctx.stroke();
      roundRect(ctx, 32, 32, 176, 176, 32); ctx.fillStyle = dark ? goldGradient(ctx, 32, 32, 208, 208) : GREEN; ctx.fill();
      ctx.drawImage(logo, 40, 40, 160, 160);
      var x = 236;
      pill(ctx, "PILGRIMSFALK", x, 84, dark ? GOLD : GREEN, dark ? GREEN : "#f6dc9a");
      ctx.fillStyle = dark ? CREAM : GREEN;
      fit(ctx, "Fågelcentralen", "400 {s}px Lora, Georgia, serif", 60, W - x - 36);
      ctx.fillText("Fågelcentralen", x, 150);
      ctx.font = "600 24px Inter, sans-serif";
      ctx.fillStyle = dark ? GOLD : GREEN;
      ctx.fillText("Stödföretag " + o.year, x, 194);
      return;
    }
    ctx.fillStyle = dark ? GREEN : CREAM;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = dark ? CREAM : GREEN;
    ctx.stroke();
    if (dark) { roundRect(ctx, 34, 34, 172, 172, 30); ctx.fillStyle = CREAM; ctx.fill(); }
    ctx.drawImage(logo, 40, 40, 160, 160);
    var fg = dark ? CREAM : GREEN, x2 = 236;
    ctx.fillStyle = fg;
    spaced(ctx, 2.5);
    ctx.font = "600 22px Inter, sans-serif";
    ctx.fillText("STOLT STÖDFÖRETAG", x2, 82);
    spaced(ctx, 0);
    fit(ctx, "Fågelcentralen", "400 {s}px Lora, Georgia, serif", 62, W - x2 - 36);
    ctx.fillText("Fågelcentralen", x2, 148);
    ctx.font = "600 26px Inter, sans-serif";
    ctx.fillText(o.year, x2, 194);
    ctx.font = "400 20px Inter, sans-serif";
    ctx.fillStyle = dark ? "rgba(247,246,241,.85)" : MUTED;
    ctx.fillText("· Tillsammans för vilda fåglar", x2 + ctx.measureText(o.year).width + 30, 193);
  }

  /* ---------- Sociala medier 1080×1080 ---------- */
  function drawSocial(canvas) {
    var o = opts(), ctx = canvas.getContext("2d"), W = 1080;
    ctx.fillStyle = o.pf ? goldGradient(ctx, 0, 0, W, W) : GREEN;
    ctx.fillRect(0, 0, W, W);
    if (o.pf) { ctx.lineWidth = 10; ctx.strokeStyle = GREEN; ctx.strokeRect(44, 44, W - 88, W - 88); }
    roundRect(ctx, W / 2 - 160, 130, 320, 320, 60); ctx.fillStyle = o.pf ? GREEN : CREAM; ctx.fill();
    ctx.drawImage(logo, W / 2 - 150, 140, 300, 300);
    ctx.textAlign = "center";
    if (o.pf) {
      ctx.font = "700 30px Inter, sans-serif"; spaced(ctx, 4);
      var pw = ctx.measureText("PILGRIMSFALK").width + 56;
      roundRect(ctx, W / 2 - pw / 2, 488, pw, 56, 28); ctx.fillStyle = GREEN; ctx.fill();
      ctx.fillStyle = "#f6dc9a"; ctx.fillText("PILGRIMSFALK", W / 2, 527); spaced(ctx, 0);
    }
    ctx.fillStyle = o.pf ? GREEN : CREAM;
    ctx.font = "400 72px Lora, Georgia, serif";
    var who = o.company || "Vi";
    var text = (o.company ? who + " är stolt " : "Vi är stolta ") + "stödföretag till Fågelcentralen " + o.year;
    var lines = wrap(ctx, text, W - 200);
    if (lines.length > 4) { ctx.font = "400 58px Lora, Georgia, serif"; lines = wrap(ctx, text, W - 200); }
    var lh = parseInt(ctx.font.match(/(\d+)px/)[1], 10) * 1.2;
    var y = o.pf ? 640 : 590;
    lines.forEach(function (l) { ctx.fillText(l, W / 2, y); y += lh; });
    spaced(ctx, 3);
    ctx.font = "600 28px Inter, sans-serif";
    ctx.fillStyle = o.pf ? GREEN : "rgba(247,246,241,.85)";
    ctx.fillText("TILLSAMMANS FÖR VILDA FÅGLAR", W / 2, Math.min(Math.max(y + 30, 940), 1000));
    spaced(ctx, 0);
    ctx.textAlign = "start";
  }

  /* ---------- Diplom 2480×1754 (A4 liggande) ---------- */
  function drawDiplom(canvas) {
    var o = opts(), ctx = canvas.getContext("2d"), W = 2480, H = 1754;
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
    if (o.pf) {
      ctx.lineWidth = 28; ctx.strokeStyle = goldGradient(ctx, 0, 0, W, H); ctx.strokeRect(80, 80, W - 160, H - 160);
      ctx.lineWidth = 4; ctx.strokeStyle = GREEN; ctx.strokeRect(124, 124, W - 248, H - 248);
    } else {
      ctx.lineWidth = 6; ctx.strokeStyle = GREEN; ctx.strokeRect(90, 90, W - 180, H - 180);
      ctx.lineWidth = 2; ctx.strokeStyle = GREEN; ctx.strokeRect(120, 120, W - 240, H - 240);
    }
    ctx.drawImage(logo, W / 2 - 130, 210, 260, 260);
    ctx.textAlign = "center";
    ctx.fillStyle = GREEN;
    spaced(ctx, 8);
    ctx.font = "600 44px Inter, sans-serif";
    ctx.fillText("DIPLOM", W / 2, 590);
    spaced(ctx, 0);
    fit(ctx, o.company || "Företagets namn", "400 {s}px Lora, Georgia, serif", 150, W - 500);
    ctx.fillStyle = o.company ? GREEN : "#8a9692";
    ctx.fillText(o.company || "Företagets namn", W / 2, 820);
    ctx.fillStyle = GREEN;
    ctx.font = "400 64px Lora, Georgia, serif";
    ctx.fillText("är stolt stödföretag till Fågelcentralen " + o.year, W / 2, 960);
    ctx.font = "400 46px Inter, sans-serif";
    ctx.fillStyle = MUTED;
    ctx.fillText("Tack för att ni hjälper skadade och sjuka vilda fåglar tillbaka till det fria.", W / 2, 1080);
    ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W / 2 - 400, 1380); ctx.lineTo(W / 2 + 400, 1380); ctx.stroke();
    ctx.font = "400 40px Inter, sans-serif";
    ctx.fillText("Fågelcentralen / Animals HOPE · Org.nr 802458-3240", W / 2, 1450);
    if (o.pf) {
      var cx = W - 430, cy = H - 430, r = 190;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = goldGradient(ctx, cx - r, cy - r, cx + r, cy + r); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r - 18, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = GREEN; ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.font = "700 34px Inter, sans-serif"; spaced(ctx, 4);
      ctx.fillText("PILGRIMSFALK", cx, cy - 20);
      spaced(ctx, 0);
      ctx.font = "400 64px Lora, Georgia, serif";
      ctx.fillText(o.year, cx, cy + 60);
    }
    ctx.textAlign = "start";
  }

  function code() {
    var o = opts();
    var alt = "Stolt " + (o.pf ? "Pilgrimsfalk-stödföretag" : "stödföretag") + " till Fågelcentralen " + o.year;
    document.getElementById("b-code").value =
      '<a href="' + SITE + '">\n  <img src="ADRESS-TILL-MÄRKET.png" alt="' + alt + '" width="240" height="80">\n</a>';
  }

  function drawAll() {
    drawBadge(document.getElementById("c-badge-light"), false);
    drawBadge(document.getElementById("c-badge-dark"), true);
    drawSocial(document.getElementById("c-social"));
    drawDiplom(document.getElementById("c-diplom"));
    code();
  }

  document.querySelectorAll("[data-download]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var o = opts();
      var canvas = document.getElementById(btn.getAttribute("data-download"));
      var name = "fagelcentralen-" + (o.pf ? "pilgrimsfalk-" : "stodforetag-") + btn.getAttribute("data-name") + "-" + o.year + ".png";
      canvas.toBlob(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      }, "image/png");
    });
  });

  document.getElementById("copy-code").addEventListener("click", function () {
    var t = document.getElementById("b-code");
    var done = function () { window.FCToast("Koden är kopierad."); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t.value).then(done, function () { t.select(); document.execCommand("copy"); done(); });
    else { t.select(); document.execCommand("copy"); done(); }
  });

  form.addEventListener("input", drawAll);
  form.addEventListener("change", drawAll);
  form.year.value = String(new Date().getFullYear() + 1);

  var ready = [
    new Promise(function (res) { if (logo.complete && logo.naturalWidth) res(); else { logo.onload = res; logo.onerror = res; } })
  ];
  if (document.fonts && document.fonts.load) {
    ready.push(document.fonts.load('400 60px "Lora"'), document.fonts.load('600 20px "Inter"'), document.fonts.load('400 20px "Inter"'));
  }
  Promise.all(ready).then(drawAll, drawAll);
})();
