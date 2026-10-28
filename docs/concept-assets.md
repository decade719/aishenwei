# 概念素材记录

生成方式：内置 image_gen，2026-10-28。原始输出保留在 Codex generated_images，网站仅引用压缩 WebP。图片均为概念示意，不是实物照片或已实现功能的证明。

## 智能盒子

网站文件：media/edge-ai-box-concept.webp（960×640），media/edge-ai-box-concept-640.webp（640×427）。

生成提示词：

Use case: product-mockup. Asset type: a premium enterprise robotics website section image, wide 3:2 landscape. Primary request: an original CONCEPT visualization of an edge-AI intelligent box which integrates perception, navigation and human interaction for assistive mobility. Subject: one compact, low rectangular graphite aluminum computing enclosure, softly beveled edges, precise fine surface texture, a restrained cyan status light, no screen; three-quarter studio angle floating slightly above a dark navy platform. Background: deep midnight-blue studio, elegant teal-blue rim light, a few fine luminous data traces reaching toward abstract perception/navigation/speech signal forms in the distance. Premium industrial-design render, physically plausible material, restrained photorealistic detailing, refined negative space, calm high-tech sophistication; keep the whole enclosure within frame and away from edges. No people, no wheelchair, no words, no numbers, no logos, no trademarks, no labels, no certifications, no watermarks. This is speculative concept artwork, not a photograph of an existing commercial product.

## 智能出行能力

网站文件：media/mobility-intelligence-concept.webp（960×640），media/mobility-intelligence-concept-640.webp（640×427）。

生成提示词：

Use case: stylized-concept. Asset type: premium robotics website capability illustration, wide 3:2 landscape. Primary request: an original high-end digital-twin visualization of intelligent wheelchair perception and navigation, conveying coordinated environment perception, route planning, safety assistance and natural interaction. Subject: a clean plausible unoccupied intelligent electric wheelchair in three-quarter view, the entire chair and wheels visible. Background: minimalist indoor architecture suggested by translucent navy linework, cyan point-cloud contours detecting nearby walls and one stationary obstacle, a thin luminous teal route curving ahead across a dark floor, small abstract signal waves near the chair suggesting voice interaction. Precise elegant industrial CGI, deep midnight blue and cyan with subtle cobalt accents, cinematic rim lighting, impressive but not cluttered, physically plausible wheelchair proportions, wide margin around the full subject. No text, no numbers, no UI panels, no logos, no people, no watermark, no medical or certification symbols. Clearly conceptual technology art rather than a real product photograph.

处理：tools/prepare-concept-media.py 按原比例缩放、WebP 编码；不裁切主体。主图上限140 KB，小图上限65 KB，使用懒加载和响应式候选。

