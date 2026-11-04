# 星悦轻量娱乐场（Lightweight Static Casino Demo）

纯静态、零依赖的网页休闲游戏合集，用于技术演示。所有游戏均使用**虚拟筹码**，**不涉及任何真实金钱或赌博服务**。

## 特性
- ⚡ **极速加载**：纯 HTML / CSS / 原生 JS，零第三方依赖，首屏体积极小。
- ♿ **无障碍**：语义化结构、跳过链接、键盘可达、ARIA 标注、尊重 `prefers-reduced-motion`。
- 📱 **响应式**：移动端、平板、桌面自适应。
- 🔍 **SEO / GEO**：完整 `meta`（title、description、keywords、Open Graph、Twitter Card）、`JSON-LD` 结构化数据（WebSite / Organization / FAQPage / BreadcrumbList / AboutPage / SoftwareApplication）、`sitemap.xml` 与 `robots.txt`。

## 游戏
| 游戏 | 路径 |
| --- | --- |
| 幸运老虎机 | `games/slots.html` |
| 骰子比大小 | `games/dice.html` |
| 抛硬币猜正反 | `games/coinflip.html` |
| 21点（Blackjack） | `games/blackjack.html` |

## Phaser 开源游戏合集
站内另有 **101 款基于 Phaser 3 的开源经典游戏复刻**（射箭、2048、贪吃蛇、扫雷、俄罗斯方块、坦克大战……），
每款都是自包含的单个 HTML 文件，纯前端、免安装、打开即玩：

| 路径 | 说明 |
| --- | --- |
| `/phaser/` | 合集页，按体育竞技 / 棋牌卡牌 / 益智解谜 / 街机动作四大类分类（`CollectionPage` + `ItemList`） |
| `/phaser/<游戏名>` | 单个游戏，例如 `/phaser/phaser-archery` |

游戏文件本体存放在 R2 `h5-game-assets/phaser/`（源），由 `infra/geo-router/arcade/publish.ps1`
同步并随站点一起发布；合集页由 `arcade/build-hub.mjs` 依据每个游戏自带的 title / h1 / description 自动生成。

## 页面
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | `index.html` | 站点总览、游戏入口、玩法说明与 FAQ |
| 品牌合集页 | `hub.html` | 汇总旗下全部游戏站点（含同账户下的其他独立站点），`CollectionPage` + `ItemList` 结构化数据 |
| 关于 | `about.html` | 项目说明与免责声明 |
| 404 | `404.html` | 错误页 |

## 本地预览
无需构建。直接用浏览器打开 `index.html`，或使用任意静态服务器：
```bash
python -m http.server 8080   # 然后访问 http://localhost:8080
```

## 测试
21 点游戏附带零依赖逻辑测试（用最小 DOM stub 加载真实 `main.js` / `blackjack.js`，跑 5000 局随机对局校验不变量）：
```bash
node tests/blackjack.test.cjs
```

## 部署
仓库根目录即站点根目录。可直接部署到任意静态托管平台。
> 社交分享封面默认使用 `assets/img/og-cover.png`（1200×630 PNG，兼容微信、微博、Twitter、Facebook 等各平台）；
> `assets/img/og-cover.svg` 作为矢量备用保留。可用 `tools/gen-og-cover.ps1` 重新生成 PNG 封面。

### 方案 A：Cloudflare Pages + 自定义域名（当前生产环境）✅
**生产地址：https://casino.vip01.cc.cd/**
（Pages 源站：https://casino-game-3nn.pages.dev/ ；Pages 项目名 `casino-game`，账户 `33717d3e6845f08352ee14d9d672e273`）

发布静态资源：
```bash
npm install -g wrangler
export CLOUDFLARE_API_TOKEN=<你的 API Token>
export CLOUDFLARE_ACCOUNT_ID=33717d3e6845f08352ee14d9d672e273
npx wrangler pages deploy . --project-name=casino-game --branch=main
```

绑定自定义域名（Worker 反向代理 + DNS）：
```powershell
$env:CLOUDFLARE_API_TOKEN = "<你的 API Token>"
$env:CLOUDFLARE_ACCOUNT_ID = "33717d3e6845f08352ee14d9d672e273"
$env:CLOUDFLARE_ZONE_ID    = "2754848880ff90a8cc6657b82accbf2a"   # vip01.cc.cd
powershell -NoProfile -ExecutionPolicy Bypass -File deploy-worker.ps1
```
`deploy-worker.ps1` 会幂等地完成三件事：
1. 上传 `worker/casino-pages-proxy.js`（ES module Worker）；
2. 删除并重建路由 `casino.vip01.cc.cd/*` 与 `www.casino.vip01.cc.cd/*`；
3. 校验该 zone 的全部路由未被破坏。

配套 DNS 记录（`vip01.cc.cd`，proxied = true）：
| 类型 | 名称 | 指向 |
| --- | --- | --- |
| CNAME | `casino` | `casino-game-3nn.pages.dev` |
| CNAME | `www.casino` | `casino-game-3nn.pages.dev` |

> **为什么要 Worker？** 该 zone 上存在一条兜底路由 `*.vip01.cc.cd/* → h5-game-geo-router`，
> 会接管所有未显式绑定的子域名并返回它自己的 404。Cloudflare 按「最具体优先」匹配路由，
> 因此给 `casino.vip01.cc.cd/*` 单独绑定一个反向代理 Worker 即可覆盖它，
> Worker 再把请求转发到 Pages 源站。Worker 同时负责：
> - `www.casino.vip01.cc.cd` → `casino.vip01.cc.cd` 的 **301 多域名跳转**；
> - 把 Pages 返回的 `Location` 改写回规范域名，避免跳到 `*.pages.dev` 丢失品牌域名。
>
> **pretty URL 说明**：Cloudflare Pages 默认把 `.html` 以 308 跳转到无扩展名路径，
> 因此 canonical / Open Graph / sitemap 使用 `/about`、`/games/slots` 这类无扩展名地址；
> 站内链接仍写 `.html`（相对路径），在 Pages、GitHub Pages、Gitee 等任意平台都能正常工作。
>
> `_headers` 文件为 Pages 提供了安全响应头（`X-Content-Type-Options` / `X-Frame-Options` /
> `Referrer-Policy`）与静态资源长期缓存（`/assets/*` → `max-age=31536000, immutable`）。

### 方案 B：GitHub Pages（镜像）
仓库已推送至 `vip-4/casino-game` 并开启 GitHub Pages，镜像地址：
**https://vip-4.github.io/casino-game/**
```bash
git push github github-clean:main
```
> 说明：仓库历史不含任何密钥；`deploy-r2.ps1` 的 R2 凭证请通过环境变量
> `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` 传入，勿硬编码。

### 方案 C：GitCode / AtomGit Pages（CI 已内置）
仓库已包含 `.gitlab-ci.yml`，推送 `master` 即触发 GitLab CI 构建并发布到 Pages。
只需在 GitCode 项目 **设置 → Pages** 中开启 Pages（若 Runner 可用会自动部署）。
访问地址形如 `https://<user>.gitcode.io/casino-game/`。

### 方案 D：Gitee Pages
1. 在 Gitee 仓库 **设置** 中将仓库设为「公开」。
2. **服务 → Gitee Pages**，部署分支选 `master`，自动生成 `https://vip882.gitee.io/casino-game/`。

### 方案 E：Cloudflare R2（对象存储 + 自定义域）
提供 `deploy-r2.ps1`（仅依赖 curl 8.13+）：
```powershell
# 前置：在 Cloudflare Dashboard 启用 R2 并创建 bucket: casino-game-prod
powershell -NoProfile -ExecutionPolicy Bypass -File deploy-r2.ps1
```
或用 AWS CLI：
```bash
aws s3 sync . s3://casino-game-prod \
  --endpoint-url https://33717d3e6845f08352ee14d9d672e273.r2.cloudflarestorage.com --profile r2
```

> bucket `casino-game-prod`（账户 `33717d3e6845f08352ee14d9d672e273`，APAC 区域）已创建并完成上传。
> 公开访问需在 Cloudflare Dashboard 为该 bucket 开启 **Public bucket / R2.dev 子域**，
> 之后可通过 `https://pub-<hash>.r2.dev/casino-game-prod/index.html` 访问；
> 也可在 Pages 项目中通过 Worker 绑定 R2 作为后端。

## 账户基础设施（infra/）
本仓库同时记录了站点所依赖的**账户级基础设施改动**，便于复现与回滚：

| 路径 | 说明 |
| --- | --- |
| `worker/casino-pages-proxy.js` | 自定义域 `casino.vip01.cc.cd` 的反向代理 Worker（`www` → 主域 301、Location 改写回规范域名） |
| `deploy-worker.ps1` | 幂等发布上面这个 Worker 并绑定路由 |
| `infra/geo-router/` | 地域路由 Worker `h5-game-geo-router` 的源码与部署脚本（详见该目录 README） |
| `infra/geo-router/deploy.ps1` | 幂等发布 geo-router（先读现有绑定再覆盖，支持 `-RemoveBinding`） |
| `infra/geo-router/upload-prerender.ps1` | 把地区预渲染页面写入 R2 `h5-game-assets`（`<region>/index.html` 等 78 个对象） |
| `infra/geo-router/locales/` | 地区落地页的本地化版本：`index.en.html`（en/sea/global）、`index.de.html`（eu）、`index.ja.html`（jpkr） |
| `infra/geo-router/arcade/` | Phaser 开源游戏合集：从 R2 同步 101 款游戏 → 生成 `/phaser/` 合集页 → 部署到 Pages |

> `h5-game-geo-router` 绑定在账户内 21 个 zone 的通配路由上，
> 是 `vip01.cc.cd` / `vip4.cc.cd` / `088.us.ci` 等全部镜像域名、以及 `fb01/gg01/tk01`
> 等平台验证子域名的实际入口。地区落地页由 R2 预渲染（`X-Render-Type: prerendered`），
> 改地区文案只需改 R2 对象、无需重新部署。详见 [`infra/geo-router/README.md`](infra/geo-router/README.md)。

## 免责声明
本项目仅供学习、演示与娱乐，不提供任何赌博服务，不涉及真实货币交易。
