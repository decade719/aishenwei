# 深维智能科技企业网站

以 HTML、CSS 和原生 JavaScript 构建的静态多页面网站。无运行时依赖，不需要安装 npm 包或执行构建。

## 本地预览与检查

安装 Node.js 20 或更高版本后，在仓库目录执行：

```sh
npm run dev
```

访问 `http://127.0.0.1:4173`。预览服务器只监听本机，不缓存页面。

```sh
npm run check
npm test
```

检查覆盖本地资源引用、JavaScript 语法、页面基础元数据、重复 ID，以及表单草稿持久化、存储损坏和空间不足。GitHub Actions 在 push / pull request 时运行同样的检查。

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

可将根目录 HTML、CSS、JS、`images/` 和 `pictures/` 发布到静态服务器。使用 GitHub Pages 时，可在仓库 Settings → Pages 选择从分支发布，分支 `main`、目录 `/ (root)`。本次上传只提交仓库文件，不自动启用托管。

若使用独立域名，请在确认域名后再添加 canonical、站点地图和域名配置，避免发布错误的网址。
