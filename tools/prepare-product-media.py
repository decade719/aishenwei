"""Prepare supplied product photos, UI artwork and demo videos for the static site."""

from argparse import ArgumentParser
from fractions import Fraction
from pathlib import Path

import av
from PIL import Image, ImageOps


parser = ArgumentParser()
parser.add_argument("--product-photo", required=True, type=Path)
parser.add_argument("--control-ui", required=True, type=Path)
parser.add_argument("--semantic-diagram", required=True, type=Path)
parser.add_argument("--following-video", required=True, type=Path)
parser.add_argument("--maneuver-video", required=True, type=Path)
args = parser.parse_args()

root = Path(__file__).resolve().parents[1]
target = root / "media"
target.mkdir(exist_ok=True)


def save_webp(source: Path, destination: str, max_width: int, quality: int) -> Path:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)
    output = target / destination
    image.save(output, "WEBP", quality=quality, method=6)
    return output


def save_poster(source: Path, destination: str, second: float) -> Path:
    container = av.open(str(source))
    selected = None
    for frame in container.decode(video=0):
        selected = frame
        if float(frame.time or 0) >= second:
            break
    container.close()
    if selected is None:
        raise RuntimeError(f"No video frame decoded from {source}")
    image = selected.to_image().convert("RGB")
    image = image.resize((480, 854), Image.Resampling.LANCZOS)
    output = target / destination
    image.save(output, "WEBP", quality=68, method=6)
    return output


def transcode_video(source: Path, destination: str) -> Path:
    input_container = av.open(str(source))
    output = target / destination
    output_container = av.open(str(output), "w", format="mp4", options={"movflags": "+faststart"})
    output_stream = output_container.add_stream("libx264", rate=30)
    output_stream.width = 480
    output_stream.height = 854
    output_stream.pix_fmt = "yuv420p"
    output_stream.options = {"crf": "30", "preset": "slow", "profile": "main"}
    for frame_number, frame in enumerate(input_container.decode(video=0)):
        resized = frame.reformat(width=480, height=854, format="yuv420p")
        resized.pts = frame_number
        resized.time_base = Fraction(1, 30)
        for packet in output_stream.encode(resized):
            output_container.mux(packet)
    for packet in output_stream.encode():
        output_container.mux(packet)
    output_container.close()
    input_container.close()
    return output


outputs = [
    save_webp(args.product_photo, "wheelchair-prototype.webp", 720, 78),
    save_webp(args.product_photo, "wheelchair-prototype-360.webp", 360, 70),
    save_webp(args.control_ui, "wheelchair-control-ui.webp", 720, 76),
    save_webp(args.semantic_diagram, "semantic-understanding.webp", 1400, 78),
    save_webp(args.semantic_diagram, "semantic-understanding-720.webp", 720, 72),
    save_poster(args.following_video, "following-test-poster.webp", 20),
    save_poster(args.maneuver_video, "maneuver-test-poster.webp", 5),
    transcode_video(args.following_video, "following-test.mp4"),
    transcode_video(args.maneuver_video, "maneuver-test.mp4"),
]

for output in outputs:
    print(f"{output.name}: {output.stat().st_size:,} bytes")
