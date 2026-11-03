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

### 方案 A：Cloudflare Pages（当前生产环境）✅
生产地址：**https://casino-game-3nn.pages.dev/**
Pages 项目名 `casino-game`（Cloudflare 账户 `33717d3e6845f08352ee14d9d672e273`）。

```bash
npm install -g wrangler
export CLOUDFLARE_API_TOKEN=<你的 API Token>
export CLOUDFLARE_ACCOUNT_ID=33717d3e6845f08352ee14d9d672e273
npx wrangler pages deploy . --project-name=casino-game --branch=main
```

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

## 免责声明
本项目仅供学习、演示与娱乐，不提供任何赌博服务，不涉及真实货币交易。
