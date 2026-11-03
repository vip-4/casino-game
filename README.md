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

## 部署
仓库根目录即站点根目录。可直接部署到任意静态托管平台。
> 社交分享封面默认使用 `assets/img/og-cover.png`（1200×630 PNG，兼容微信、微博、Twitter、Facebook 等各平台）；
> `assets/img/og-cover.svg` 作为矢量备用保留。可用 `tools/gen-og-cover.ps1` 重新生成 PNG 封面。

### 方案 A：GitHub Pages（当前生产环境）
仓库已推送至 `vip-4/casino-game` 并开启 GitHub Pages，生产地址：
**https://vip-4.github.io/casino-game/**

```bash
# 本地修改后同步到 GitHub（本仓库经 orphan 分支 github-clean 推送）：
git push github github-clean:main
```
> 说明：仓库历史不含任何密钥；`deploy-r2.ps1` 的 R2 凭证请通过环境变量
> `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` 传入，勿硬编码。

### 方案 B：Cloudflare Pages
在**本机**（需能访问 Cloudflare）安装 Node.js 后执行：
```bash
npx wrangler pages deploy . --project-name=casino-game-prod
# 首次会引导登录；项目名可自定义，部署后默认域名 https://<project>.pages.dev
```

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
  --endpoint-url https://ceffe067ff7027b695ef91fcea9fa38a.r2.cloudflarestorage.com --profile r2
```

> 环境说明：当前开发环境代理层限制了对外文件上传（Cloudflare Pages / R2 S3 端点不可达），
> 上述部署步骤需在可直连目标平台的本机执行；站点源码与 CI 配置均已就绪，可直接部署。

## 免责声明
本项目仅供学习、演示与娱乐，不提供任何赌博服务，不涉及真实货币交易。
