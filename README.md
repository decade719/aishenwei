# 深维智能科技（镇江）有限公司企业网站

以 HTML、CSS 和原生 JavaScript 构建的多页面企业网站。公开页面作为静态资源发布；联系表单及管理员接口运行在 Cloudflare Worker 中，咨询记录以一个 JSON 数组保存到持久存储对象。发布时网站文件会收集到独立的 `dist/` 目录。

## 本地预览与检查

安装 Node.js 22 或更高版本后，在仓库目录执行：

```sh
npm run dev
```

访问 `http://127.0.0.1:4173`。完整预览会同时启动公开网页、表单接口和本地持久存储。只检查静态页面时可运行 `npm run dev:static`。

```sh
npm run check
npm test
```

检查覆盖本地资源引用、JavaScript 语法、页面基础元数据、重复 ID，以及表单草稿持久化、存储损坏和空间不足。还会测试发布文件隔离与 25 MiB 单文件大小限制。GitHub Actions 在 push / pull request 时运行检查、构建和 Wrangler 部署预检（不实际发布）。

## 页面与维护

公司主导航为首页、产品方案、技术能力、应用案例、关于深维、联系我们。高校和课题组只在页脚进入的生态合作、合作研究团队及研究者详情中展示，明确不代表公司员工组织。

- `company.css` / `company.js`：公司页面共享样式、手机菜单、中英文、深浅主题和需求草稿交互。
- `index.html` / `product_chair.html`：公司首页及智能轮椅方案，概念图均有示意标注。
- `more.html` / `cases.html`：技术能力和应用示例；不将合作团队的学术成果直接声称为公司成果。
- `about.html` / `contact.html`：公司介绍及需求草稿。
- `partners.html` / `members.html` / `member-profile.html`：独立的外部合作团队入口。
- `styles.css`、`script.js`、`site-enhancements.*`：保留给原有详情与本机演示页面。

布局覆盖手机、平板及宽屏，长页面使用自然滚动。主页面提供中英文，研究者详细学术资料仍以中文为主。设计取舍见 `DESIGN.md`。

各公司页面通过 `site-effects.js` 提供全局粒子连线与蓝青光晕，单张固定画布覆盖视口，滚动到正文和页脚时仍保留效果。手机端限制为 24 个粒子、24 fps，桌面端最多 88 个、30 fps；后台、减少动态效果或节约流量模式下暂停动态绘制。`premium.css` 统一深海蓝、青色信号线与通透面板；默认深色，保留浅色切换。联系页提供业务邮箱，暂不公开公司地址。

首页按四项能力、轮椅与四款场景方案、智能盒子组织产品介绍。参考邦邦机器人核心技术页的分块叙事方式，文案依据本站现有素材重新撰写。两张 AI 概念图均标注示意；网站只使用压缩 WebP，手机端通过 picture source 固定选用 640 px 小图（轮椅约48 KB、盒子约20 KB），原始生成图不进入发布目录。提示词及来源说明见 `docs/concept-assets.md`。

87 张基础图片进一步从 11,084,176 字节压缩到 5,109,790 字节，减少约 53.9%。另提供响应式小图；手机端限制图片候选宽度，避免微信浏览器因 2x / 3x 屏幕像素密度直接下载 960 或 1440 px 版本。首屏图片预加载，其余图片懒加载。普通图最大边长 1440 px、图表 1600 px、头像 480 px。原始素材保留在仓库外。

正式品牌名称以用户提供的标志资料为准：中文为“深维智能科技（镇江）有限公司”，英文为“Shenwei Intelligent Technology (Zhenjiang) Co., Ltd”。导航与页脚使用约 9 KB 的透明图形标志，关于页使用 `images/shenwei-logo-lockup.svg` 展示完整名称与标志。

产品页的新素材位于 `media/`：产品图和界面图压缩为 WebP，两段测试视频统一转为微信浏览器兼容的 H.264 MP4，并生成独立封面。视频使用 `preload="none"`，不会在打开页面时随首屏内容一起下载。约 61 秒的视频压缩为约 4.24 MiB，约 9 秒的视频压缩为约 0.52 MiB；两段视频均移除现场环境音。

安装 Pillow 后，从原始图片生成（不要将压缩后的 pictures 作为输入）：

```sh
python tools/prepare-responsive-images.py /path/to/original/pictures
```

安装 Pillow 与 PyAV 后，可从本地原始产品素材重新生成 `media/` 内容：

```sh
python tools/prepare-product-media.py --product-photo /path/to/product.png --control-ui /path/to/ui.jpg --semantic-diagram /path/to/diagram.png --following-video /path/to/following.mp4 --maneuver-video /path/to/maneuver.mp4
```

`_headers` 为图片与共享样式设置浏览器缓存。更换同名图片后缓存最多保留七天；需要即时更新时使用新文件名。

## 在线咨询与管理员入口

- 公司联系页通过 `/api/contact` 在线提交姓名、邮箱、电话、机构和需求说明；不接收附件，也不会自动生成订单。
- 记录在 `InquiryStore` 的 `inquiries.json` 存储键中，以序列化 JSON 数组字符串保存；不使用 D1，也不依赖浏览器缓存。管理员可以在 `admin-login.html` 登录、搜索、查看和逐条删除。
- 按当前项目要求，管理员密码直接定义在 `worker/index.js` 的 `ADMIN_PASSWORD` 常量中，不需要额外配置 Cloudflare Secret。仓库公开时该密码也会公开，应仅用于低风险演示；正式收集业务资料前建议改回加密 Secret。
- 接口包含同源检查、字段与长度校验、隐藏蜜罐字段和基础提交频率限制。业务正式运行后仍应定期导出重要记录，并按实际隐私制度确定保存期限。
- `samples/` 为原目录中的第三方参考页面，不是企业网站页面，已排除在 Git 提交之外。

## 静态托管

### Cloudflare Workers

在 Cloudflare 的 `aishenwei` Worker → Settings → Build 中使用以下配置：

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 根目录 | 仓库根目录（留空） |
| 构建命令 | `npm run build` |
| 部署命令 | `npx wrangler deploy` |

保存后部署最新提交。资源目录由已提交的 `wrangler.jsonc` 指定为 `./dist`，Worker 入口为 `worker/index.js`；不要把资源目录改成 `.`，也不要在部署命令中添加 `--assets .`。

构建只复制根目录 HTML、CSS、JS、`_redirects` 路由规则、`_headers` 缓存规则以及 `images/`、`pictures/`、`media/` 中的公开素材，并验证生成目录里的页面引用及每个文件不超过 25 MiB。`node_modules/`、Git 文件、测试、工具脚本和示例页面不会发布。每次构建会重新生成 `dist/`，无需把它提交到 Git。页面保留 `.html` 地址，`_redirects` 将 `/` 映射到首页，保持原有导航与页面脚本行为。

Cloudflare Workers Builds 的构建命令需在控制台显式设置；仓库中 `build.command` 为本地 Wrangler 调用提供同样的构建步骤。配置说明见 [Cloudflare Workers Builds 文档](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。

本地部署预检（不会发布到 Cloudflare）：

```sh
npm ci
npm run build
npx wrangler deploy --dry-run
```

### 其他静态服务器

运行 `npm run build` 后发布 `dist/` 的内容。使用 GitHub Pages 从分支发布时，仍可选择分支 `main`、目录 `/ (root)`；源码中的网站路径保持不变。

若使用独立域名，请在确认域名后再添加 canonical、站点地图和域名配置，避免发布错误的网址。
