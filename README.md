# 深维智能科技企业网站

以 HTML、CSS 和原生 JavaScript 构建的静态多页面网站。无运行时依赖，本地预览无需构建；发布时将网站文件收集到独立的 `dist/` 目录。Wrangler 仅用于 Cloudflare 部署。

## 本地预览与检查

安装 Node.js 22 或更高版本后，在仓库目录执行：

```sh
npm run dev
```

访问 `http://127.0.0.1:4173`。预览服务器只监听本机，不缓存页面。

```sh
npm run check
npm test
```

检查覆盖本地资源引用、JavaScript 语法、页面基础元数据、重复 ID，以及表单草稿持久化、存储损坏和空间不足。还会测试发布文件隔离与 25 MiB 单文件大小限制。GitHub Actions 在 push / pull request 时运行检查、构建和 Wrangler 部署预检（不实际发布）。

## 页面与维护

| 文件 | 用途 |
| --- | --- |
| `index.html` / `home.css` | 企业首页与首页样式 |
| `product_chair.html` | 智能轮椅产品介绍 |
| `more.html` / `cases.html` | 具身智能介绍与成果案例 |
| `members.html` / `member-profile.html` | 团队与成员详情 |
| `about.html` / `partners.html` / `contact.html` | 企业介绍、合作伙伴与联系表单 |
| `styles.css` / `script.js` | 原有共享样式与语言、主题交互 |
| `site-enhancements.css` / `site-enhancements.js` | 响应式、自然滚动、导航与键盘可访问性 |
| `pictures/` | 优化后的 WebP 图片 |

原有品牌、产品、团队、案例内容保留。首页重新整理信息层级；开发中的产品明确标注；移动导航去掉重复事件；各详情页改为自然滚动，避免长内容被裁切。语言选项覆盖现有翻译字典，部分详细正文仍沿用中文，尚未实现全文翻译。

87 张图片由约 150.5 MB 优化为 11.1 MB（十进制），减少约 92.6%；最大边长 1920 px，WebP 质量 86。图片增加尺寸声明、异步解码与非首屏懒加载。原始图片保留在上传前的本地原始目录，不重复提交到仓库。

如需重新生成图片，安装 Pillow 后执行：

```sh
python tools/optimize-images.py /path/to/original/pictures
```

## 静态表单与本机演示的范围

网站尚未接入服务器、数据库或邮件发送服务：

- 留言、求职和订购表单只保存为当前浏览器的本机草稿，不会发送给企业，不会生成真实订单。
- 简历附件仅记录文件名，不上传文件。清除浏览器站点数据会清除本机草稿。
- `admin-login.html` 与 `admin-dashboard.html` 是本机内容管理演示，不提供身份验证，不能读取其他访客的草稿或在线发布内容。不要存放真实业务资料。
- 正式收集咨询、订单或简历前，应接入服务端表单接口、身份验证与访问控制，并确认页面中的企业联系方式和内容。浏览器存储不能替代业务后台。
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

保存后部署最新提交。资源目录由已提交的 `wrangler.jsonc` 指定为 `./dist`，不要改成 `.`，也不要在部署命令中添加 `--assets .`。

构建只复制根目录 HTML、CSS、JS、`_redirects` 路由规则和 `images/`、`pictures/` 中的图片，并验证生成目录里的页面引用及每个文件不超过 25 MiB。`node_modules/`、Git 文件、测试、工具脚本和示例页面不会发布。每次构建会重新生成 `dist/`，无需把它提交到 Git。页面保留 `.html` 地址，`_redirects` 将 `/` 映射到首页，保持原有导航与页面脚本行为。

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
