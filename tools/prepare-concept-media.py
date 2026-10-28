"""Create compact, responsive WebP assets from original generated concept art."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--box', type=Path, required=True)
parser.add_argument('--mobility', type=Path, required=True)
args = parser.parse_args()
target = Path(__file__).resolve().parent.parent / 'media'

for name, source in [('edge-ai-box-concept', args.box), ('mobility-intelligence-concept', args.mobility)]:
    original = Image.open(source).convert('RGB')
    for width, suffix, budget in [(960, '', 140_000), (640, '-640', 65_000)]:
        image = original.copy()
        image.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
        output = target / f'{name}{suffix}.webp'
        for quality in (80, 76, 72, 68, 64):
            image.save(output, 'WEBP', quality=quality, method=6)
            if output.stat().st_size <= budget:
                break
        if output.stat().st_size > budget:
            raise RuntimeError(f'{output.name} exceeds concept image budget')
        print(f'{output.name}: {image.width}x{image.height}, {output.stat().st_size:,} bytes, quality {quality}')
