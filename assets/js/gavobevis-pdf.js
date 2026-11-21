/*
 * Gåvobevis som PDF (A4 stående), skapad i webbläsaren utan externa bibliotek.
 * Ritas på en canvas med sajtens typsnitt och packas som en JPEG-bild i en
 * PDF-sida. I drift skapas samma PDF av servern efter betalningen och mejlas.
 *
 * FCGiftPDF.draw(canvas, data)  – ritar beviset
 * FCGiftPDF.make(data, prefix)  – Promise<Blob> med PDF:en
 * data: { to, from, message, motiv, belopp }
 */
(function () {
  "use strict";
  var W = 1754, H = 2480; // A4 i cirka 210 dpi
  var GREEN = "#163f35", CREAM = "#f7f6f1", MUTED = "#4f5e59";

  function load(src) {
    return new Promise(function (res, rej) {
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = rej;
      i.src = src;
    });
  }
  function wrap(ctx, text, max) {
    var out = [];
    String(text).split(/\n/).forEach(function (para) {
      var line = "";
      para.split(" ").forEach(function (w) {
        var t = line ? line + " " + w : w;
        if (ctx.measureText(t).width > max && line) { out.push(line); line = w; } else { line = t; }
      });
      out.push(line);
    });
    return out;
  }
  function archPath(ctx, x, y, w, h, big, small) {
    ctx.beginPath();
    ctx.moveTo(x + big, y);
    ctx.arcTo(x + w, y, x + w, y + h, small);
    ctx.arcTo(x + w, y + h, x, y + h, small);
    ctx.arcTo(x, y + h, x, y, small);
    ctx.arcTo(x, y, x + w, y, big);
    ctx.closePath();
  }

  function draw(canvas, d, img, logo) {
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);

    // Motiv med samma bildform som på sajten
    var ix = 140, iy = 140, iw = W - 280, ih = Math.round(iw * 10 / 16);
    ctx.save(); archPath(ctx, ix, iy, iw, ih, 260, 40); ctx.clip();
    var s = Math.max(iw / img.width, ih / img.height);
    ctx.drawImage(img, ix + (iw - img.width * s) / 2, iy + (ih - img.height * s) / 2, img.width * s, img.height * s);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = GREEN;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "10px";
    ctx.font = "600 40px Inter, sans-serif";
    var y = iy + ih + 150;
    ctx.fillText("GÅVOBEVIS", W / 2, y);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    y += 150;
    var size = 112;
    do { ctx.font = "400 " + size + "px Lora, Georgia, serif"; size -= 4; } while (ctx.measureText("Till " + d.to).width > W - 320 && size > 50);
    ctx.fillText("Till " + d.to, W / 2, y);

    if (d.message) {
      ctx.font = "italic 400 54px Lora, Georgia, serif";
      y += 60;
      wrap(ctx, d.message, W - 420).slice(0, 6).forEach(function (l) { y += 76; ctx.fillText(l, W / 2, y); });
    }

    ctx.font = "400 42px Inter, sans-serif";
    ctx.fillStyle = MUTED;
    y += 110;
    wrap(ctx, "En gåva på " + Number(d.belopp).toLocaleString("sv-SE") + " kr till Fågelcentralen har getts i ditt namn – för skadade och sjuka vilda fåglar.", W - 460)
      .forEach(function (l) { ctx.fillText(l, W / 2, y); y += 60; });

    ctx.fillStyle = GREEN;
    ctx.font = "600 50px Inter, sans-serif";
    y += 50;
    ctx.fillText("Från " + d.from, W / 2, y);

    // Logga och avsändare längst ner
    var ly = H - 330;
    ctx.drawImage(logo, W / 2 - 230, ly, 110, 110);
    ctx.textAlign = "left";
    ctx.font = "400 64px Lora, Georgia, serif";
    ctx.fillText("Fågelcentralen", W / 2 - 100, ly + 78);
    ctx.textAlign = "center";
    ctx.font = "400 34px Inter, sans-serif";
    ctx.fillStyle = MUTED;
    ctx.fillText("Fågelcentralen / Animals HOPE · Org.nr 802458-3240", W / 2, H - 120);
  }

  /* Minimal PDF med en JPEG-bild som fyller en A4-sida */
  function jpegToPdf(bytes, pxW, pxH) {
    var enc = new TextEncoder();
    var parts = [], offsets = [], length = 0;
    function add(x) { var b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); length += b.length; }
    function obj(n, body, stream) {
      offsets[n] = length;
      add(n + " 0 obj\n" + body);
      if (stream) { add("stream\n"); add(stream); add("\nendstream"); }
      add("\nendobj\n");
    }
    var pw = 595.28, ph = 841.89;
    var content = "q " + pw + " 0 0 " + ph + " 0 0 cm /Im0 Do Q";
    add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pw + " " + ph + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
    obj(4, "<< /Type /XObject /Subtype /Image /Width " + pxW + " /Height " + pxH +
      " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + bytes.length + " >>\n", bytes);
    obj(5, "<< /Length " + content.length + " >>\n", enc.encode(content));
    var xref = length;
    var x = "xref\n0 6\n0000000000 65535 f \n";
    for (var i = 1; i <= 5; i++) x += ("0000000000" + offsets[i]).slice(-10) + " 00000 n \n";
    add(x + "trailer\n<< /Size 6 /Root 1 0 R /Info << /Title (Gavobevis - Fagelcentralen) >> >>\nstartxref\n" + xref + "\n%%EOF");
    return new Blob(parts, { type: "application/pdf" });
  }

  function make(d, prefix) {
    prefix = prefix || "";
    var fonts = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('400 60px "Lora"'), document.fonts.load('italic 400 54px "Lora"'), document.fonts.load('600 40px "Inter"'), document.fonts.load('400 40px "Inter"')]).catch(function () {})
      : Promise.resolve();
    return Promise.all([load(prefix + "assets/img/motiv-" + (d.motiv || "rodhake") + ".jpg"), load(prefix + "assets/img/logo-mark.svg"), fonts])
      .then(function (r) {
        var c = document.createElement("canvas");
        draw(c, d, r[0], r[1]);
        return new Promise(function (res) { c.toBlob(res, "image/jpeg", 0.88); });
      })
      .then(function (blob) { return blob.arrayBuffer(); })
      .then(function (buf) { return jpegToPdf(new Uint8Array(buf), W, H); });
  }

  window.FCGiftPDF = { make: make, draw: draw, W: W, H: H };
})();
