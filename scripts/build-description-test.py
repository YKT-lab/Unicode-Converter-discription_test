import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "description-test.json"
OUT = ROOT / "description-test.html"

data = json.loads(DATA.read_text(encoding="utf-8"))
entries = data.get("entries", [])

def esc(value):
    return escape(str(value or ""), quote=True)

def section(title, text):
    if not text:
        return ""
    return (
        '<div class="test-section">'
        f'<div class="test-heading">{esc(title)}</div>'
        f'<p>{esc(text)}</p>'
        '</div>'
    )

cards = []
for index, entry in enumerate(entries, start=1):
    info = entry.get("info") or {}
    svg = entry.get("svg") or {}
    facts = info.get("facts") or []
    trans = next(
        (fact.get("text", "") for fact in facts if fact.get("kind") == "functionValue"),
        ""
    )

    sources_html = ""
    sources = info.get("sources") or []
    if sources:
        links = "".join(
            f'<li><a href="{esc(source.get("url"))}" target="_blank" rel="noopener noreferrer">{esc(source.get("name"))}</a></li>'
            for source in sources
        )
        sources_html = (
            '<details class="test-sources">'
            '<summary>出典を見る</summary>'
            f'<ul>{links}</ul>'
            '</details>'
        )

    trans_html = (
        f'<div class="test-trans"><strong>転写</strong><span>{esc(trans)}</span></div>'
        if trans else ""
    )

    cards.append(
        '<section class="test-card">'
        '<div class="test-card-head">'
        f'<span>#{index} / {len(entries)}</span>'
        f'<span>{esc(info.get("script"))} · {esc(entry.get("font"))}</span>'
        '</div>'
        '<div class="test-layout">'
        '<div>'
        '<div class="test-glyph-frame">'
        f'<svg class="test-glyph" viewBox="{esc(svg.get("viewBox"))}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="{esc(entry.get("character"))}">'
        f'<path d="{esc(svg.get("path"))}" transform="scale(1 -1)" fill="currentColor"></path>'
        '</svg>'
        '</div>'
        f'<div class="test-code">U+{esc(entry.get("codePoint"))}</div>'
        f'<div class="test-name">{esc(info.get("unicodeName"))}</div>'
        f'{trans_html}'
        '</div>'
        '<div class="test-info">'
        f'{section("どんな文字？", info.get("summary"))}'
        f'{section("使われ方", info.get("usage"))}'
        f'{section("補足情報", info.get("supplementalInfo"))}'
        f'{sources_html}'
        '</div>'
        '</div>'
        '</section>'
    )

html = f'''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>今日の一文字 10件テスト</title>
<link rel="stylesheet" href="./style.css">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600&display=swap">
<style>
main.test-main{{max-width:920px}}
.test-head{{margin-bottom:18px}}
.test-head h1{{margin-bottom:6px}}
.test-note{{margin:0;color:#777;font-size:13px}}
.test-list{{display:grid;gap:18px}}
.test-card{{padding:18px;background:#fff;border-radius:20px;box-shadow:0 2px 14px rgba(0,0,0,.07)}}
.test-card-head{{display:flex;justify-content:space-between;gap:10px;margin-bottom:12px;color:#666;font-size:12px;font-weight:700}}
.test-layout{{display:grid;grid-template-columns:minmax(150px,.7fr) minmax(0,1.5fr);gap:18px;align-items:stretch}}
.test-glyph-frame{{display:flex;min-height:150px;align-items:center;justify-content:center;padding:14px 10px;border:1px solid #dcdce1;border-radius:16px;background:#fafafa}}
.test-glyph{{display:block;width:110px;height:110px;max-width:100%;color:#1d1d1f;shape-rendering:geometricPrecision}}
.test-code{{margin-top:10px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;font-size:14px;font-weight:700;color:#3b3b3d}}
.test-name{{margin-top:5px;text-align:center;color:#777;font-size:10px;font-weight:600;line-height:1.45;overflow-wrap:anywhere}}
.test-trans{{display:flex;justify-content:center;gap:7px;margin-top:9px;color:#555;font-size:14px}}
.test-trans strong{{font-size:10px}}
.test-info{{min-width:0;padding:16px;border:1px solid #e3e3e7;border-radius:16px;background:#fff;text-align:left}}
.test-section+.test-section{{margin-top:14px}}
.test-heading{{margin-bottom:5px;color:#555;font-size:12px;font-weight:700}}
.test-info p{{margin:0;color:#262628;font-size:14px;line-height:1.7}}
.test-sources{{margin-top:16px;padding-top:12px;border-top:1px solid #ededf0}}
.test-sources summary{{width:fit-content;color:#666;font-size:11px;cursor:pointer}}
.test-sources ul{{margin:8px 0 0;padding-left:18px}}
.test-sources li{{margin-top:4px;font-size:11px;line-height:1.5}}
.test-sources a{{color:#007aff;text-decoration:none;overflow-wrap:anywhere}}
@media(max-width:620px){{
.test-card{{padding:13px;border-radius:16px}}
.test-layout{{grid-template-columns:minmax(105px,.7fr) minmax(0,1.3fr);gap:10px;align-items:start}}
.test-glyph-frame{{min-height:130px}}
.test-glyph{{width:88px;height:88px}}
.test-code{{font-size:12px}}
.test-name{{font-size:9px}}
.test-info{{padding:12px;border-radius:14px}}
.test-heading{{font-size:11px}}
.test-info p{{font-size:12px;line-height:1.65}}
.test-card-head{{font-size:10px}}
.test-trans{{gap:5px;font-size:12px}}
.test-trans strong{{font-size:9px}}
}}
</style>
</head>
<body>
<main class="test-main">
<div class="test-head">
<h1>今日の一文字 10件テスト</h1>
<p class="test-note">生成: {esc(data.get("generatedAt"))} ・ {len(entries)}件</p>
</div>
<div class="test-list">
{''.join(cards)}
</div>
</main>
</body>
</html>
'''

OUT.write_text(html, encoding="utf-8")
print(f"Built {OUT.name} with {len(entries)} cards.")
