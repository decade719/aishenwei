"""Compress existing site copies; originals stay untouched. Usage: python tools/prepare-responsive-images.py ORIGINAL_PICTURES"""
from pathlib import Path
from io import BytesIO
import argparse
from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('original_pictures', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
target = root / 'pictures'
original = args.original_pictures.resolve()
if original == target.resolve():
    raise SystemExit('Originals must be in a separate directory.')
sources = {p.stem.casefold(): p for p in original.iterdir() if p.is_file() and p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'}}
before = sum(p.stat().st_size for p in target.glob('*.webp'))
responsive = target / 'responsive'
responsive.mkdir(exist_ok=True)
selected = {'智能轮椅产品', '工业视觉', '机器人导航1', '人机交互', '技术服务', '具身智能', '智能运货小车产品', '智能餐车产品', '室内', '室外导航', '情感陪伴', '产品轮椅室内', '产品轮椅室外', '产品轮椅漫游', '产品轮椅至尊', '1', '5', '8', '10'}
count = 0
for output in target.glob('*.webp'):
    source = sources.get(output.stem.casefold())
    if not source:
        raise SystemExit(f'Missing original for {output.name}')
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert('RGB')
    diagram = output.stem.isdecimal()
    portrait = output.stem.startswith('成员') or output.stem == '老师'
    size = 480 if portrait else (1600 if diagram else 1440)
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    encoded = BytesIO()
    image.save(encoded, format='WEBP', quality=82 if diagram else 74, method=6)
    if len(encoded.getvalue()) < output.stat().st_size:
        output.write_bytes(encoded.getvalue())
    if output.stem in selected:
        # Derive each size from the same source, never repeatedly recompress a thumbnail.
        for width in (480, 960):
            if image.width <= width:
                continue
            small = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
            # Mobile WeChat often reports a 2x/3x device-pixel ratio. Keep these
            # variants deliberately light because the HTML caps the advertised
            # mobile display width and prevents a jump to the 1440 px original.
            quality = (74 if diagram else 64) if width == 480 else (78 if diagram else 68)
            small.save(responsive / f'{output.stem}-{width}.webp', quality=quality, method=6)
            count += 1
after = sum(p.stat().st_size for p in target.glob('*.webp'))
print(f'Base images: {before:,} -> {after:,} bytes; reduced {(1-after/before)*100:.1f}%. Generated {count} responsive variants.')
