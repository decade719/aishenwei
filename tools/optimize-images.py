"""Generate WebP assets and update source references (requires Pillow).

Usage: python tools/optimize-images.py PATH_TO_ORIGINAL_PICTURES
Originals remain in the supplied source directory.
"""
from pathlib import Path
import argparse
import json
import re
from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
destination = root / 'pictures'
destination.mkdir(exist_ok=True)
mapping, before, after = {}, 0, 0
for source in sorted(args.source.iterdir()):
    if source.suffix.lower() not in {'.png', '.jpg', '.jpeg'}:
        continue
    target = destination / (source.stem + '.webp')
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=86, method=6)
    before += source.stat().st_size
    after += target.stat().st_size
    mapping[source.name] = target.name

for path in root.iterdir():
    if path.suffix in {'.html', '.css', '.js'}:
        text = path.read_text(encoding='utf-8-sig')
        for original, optimized in mapping.items():
            text = re.sub(re.escape('pictures/' + original), lambda _: 'pictures/' + optimized, text, flags=re.I)
        path.write_text(text, encoding='utf-8')

# Remove only identical copied originals inside this checkout, after conversion.
for original, optimized in mapping.items():
    copied = (destination / original).resolve()
    source = (args.source / original).resolve()
    if copied.parent != destination.resolve() or copied == source:
        continue
    if copied.exists() and copied.read_bytes() == source.read_bytes():
        copied.unlink()

print(json.dumps({'images': len(mapping), 'before_bytes': before,
                  'after_bytes': after, 'reduction_percent': round((1-after/before)*100, 1)}, ensure_ascii=True))
