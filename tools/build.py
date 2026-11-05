"""Turns site/ + content/site.json into _site/ for GitHub Pages.

The editor only ever writes content/site.json and uploads into site/img/.
Layout and code stay out of its reach. BASE is the Pages sub-path; on a real
domain it would be empty.
"""
import html
import json
import pathlib
import re
import shutil

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / '_site'
BASE = '/aframs-edit-demo'
MAX_PHOTO = 1400
SLOTS = [('tall', 900, 1125), ('', 900, 994), ('', 900, 900), ('wide', 1000, 620)]
HOURS_SHORT = 'Tuesday to Saturday, 10 to&nbsp;6'
HOURS_LONG = 'Tuesday to Saturday, 10 AM to 6 PM<br>Closed Sunday and Monday'

content = json.loads((ROOT / 'content' / 'site.json').read_text(encoding='utf8'))
esc = lambda v: html.escape(str(v or '').strip(), quote=True)


def shrink(rel):
    """Phone photos arrive at 4000+ px. Resize the published copy only."""
    path = OUT / rel.lstrip('/')
    if not path.is_file() or path.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
        return
    with Image.open(path) as im:
        if max(im.size) <= MAX_PHOTO:
            return
        im = ImageOps.exif_transpose(im)
        im.thumbnail((MAX_PHOTO, MAX_PHOTO))
        if path.suffix.lower() in ('.jpg', '.jpeg'):
            im.convert('RGB').save(path, quality=82, optimize=True, progressive=True)
        else:
            im.save(path)


def gallery():
    tags = []
    for (cls, w, h), item in zip(SLOTS, content.get('gallery', [])):
        src = item.get('photo') or ''
        if not src:
            continue
        shrink(src)
        attr = f' class="{cls}"' if cls else ''
        tags.append(f'<img{attr} src="{esc(src)}" alt="{esc(item.get("description"))}" width="{w}" height="{h}" loading="lazy">')
    return '\n        '.join(tags)


def banner():
    a = content.get('announcement') or {}
    if not a.get('show') or not str(a.get('text') or '').strip():
        return ''
    return f'<div class="edit-banner" role="status">{esc(a["text"])}</div>\n'


def rebase(text):
    text = re.sub(r'((?:href|src|action)=")/(?!/)', rf'\1{BASE}/', text)
    text = re.sub(r'url\((["\']?)/(?!/)', rf'url(\1{BASE}/', text)
    text = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + re.sub(r'(^|,\s*)/(?!/)', rf'\1{BASE}/', m.group(1)) + '"', text)
    return text


if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(ROOT / 'site', OUT)
(OUT / '.nojekyll').write_text('')

css = '.edit-banner{background:#152237;color:#f4f0e6;text-align:center;padding:10px 16px;font-size:15px;line-height:1.4;font-weight:600}\n'
site_css = OUT / 'css' / 'site.css'
site_css.write_text(css + site_css.read_text(encoding='utf8'), encoding='utf8')

top = banner()
short = esc(content.get('hours_short')) or HOURS_SHORT
long_ = f"{esc(content.get('hours_long'))}<br>{esc(content.get('closed_days'))}"

for page in OUT.rglob('*.html'):
    text = page.read_text(encoding='utf8')
    text = text.replace(HOURS_SHORT, short).replace(HOURS_LONG, long_)
    if top:
        text = text.replace('<header class="hdr">', top + '<header class="hdr">', 1)
    if page == OUT / 'index.html':
        text = text.replace('<h2>From the&nbsp;cases.</h2>', f"<h2>{esc(content.get('cases_heading'))}</h2>")
        text = re.sub(r'(<div class="cases-grid rv" data-drift>\s*).*?(\s*</div>)', lambda m: m.group(1) + gallery() + m.group(2), text, count=1, flags=re.S)
    page.write_text(rebase(text), encoding='utf8')

for sheet in (OUT / 'css').glob('*.css'):
    sheet.write_text(rebase(sheet.read_text(encoding='utf8')), encoding='utf8')

print('built', len(list(OUT.rglob('*.html'))), 'pages; banner', 'on' if top else 'off')
