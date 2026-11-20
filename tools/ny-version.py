#!/usr/bin/env python3
"""
Byter versionsnummer på CSS- och JavaScript-filerna i alla HTML-sidor.

Kör efter varje ändring i assets/css eller assets/js:

    python3 tools/ny-version.py

Webbläsare sparar CSS och JavaScript en stund (cache). Med ett nytt
versionsnummer i adressen (styles.css?v=...) hämtar de alltid den nya filen,
så att besökare inte får ny HTML ihop med gammal CSS.
"""
import glob
import os
import re
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
version = time.strftime("%Y%m%d%H%M")
pattern = re.compile(r'((?:href|src)="(?:\.\./)?assets/(?:css|js)/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"')

changed = 0
for path in glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "admin", "*.html")):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    new = pattern.sub(lambda m: '%s?v=%s"' % (m.group(1), version), text)
    if new != text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
        changed += 1

print("Version %s satt i %d filer." % (version, changed))
