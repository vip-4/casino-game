# h5-game-geo-router

账户内的**地域路由 Worker**，绑定在全部 21 个 zone 的通配路由上：

```
*.vip01.cc.cd/*   *.vip4.cc.cd/*   *.088.us.ci/*   *.866.cc.cd/*  ...
        ->  h5-game-geo-router
```

它按访客地区（cn / en / eu / sea / jpkr / global）选择源站、做地区化缓存与静态资源加速，
上游是 Cloudflare Pages 源站（`REGIONS.origin`）。

## 本次修复（2026-11-04）

账户内 22 个域名的通配子域名与 `fb01/fb02/gg01/gg02/tk01`（平台域名验证用）全部 404 / 500，
排查出 **两个独立故障**：

### 故障一：上游 Pages 源站已被删除
`REGIONS.origin` 指向 `https://h5games-3hm.pages.dev`，该 Pages 项目已不存在（404）。
新增 Pages 项目后子域被自动加后缀 → `h5games-3hm-1o0.pages.dev`，
因此把 `REGIONS` / `SITE_URL` 两个绑定里的源站地址同步改为新地址。

### 故障二：静态资源分支自我递归
原代码：

```js
if (isStaticAsset(pathname, config2.staticExtensions)) {
  const response = await fetch(request);   // fetch 自身 URL → 再次命中同一条路由 → 死循环
```

`fetch(request)` 在 Worker 内会对**同一个 URL** 再发一次子请求，而该 URL 正好命中自己绑定的
路由，于是无限递归 → Cloudflare 返回 **522**（`X-Cache: STATIC`）。
表现为：HTML 正常，但 `/assets/**`（css / js / png）全部 522，页面无样式。

修复后改为回源拉取，并显式去掉 `Host` 头，避免把访客域名带给 Pages：

```js
const staticRegionCfg = config2.regions && config2.regions[regionCode]
  ? config2.regions[regionCode]
  : (config2.regions && config2.regions[config2.defaultRegion]);
const staticOrigin = staticRegionCfg ? staticRegionCfg.origin : null;
const staticHeaders = new Headers(request.headers);
staticHeaders.delete("host");
const response = staticOrigin
  ? await fetch(new Request(staticOrigin + pathname + url.search, { method: "GET", headers: staticHeaders }))
  : await fetch(request);
```

`h5-game-geo-router.original.js` 是修复前的原始版本，保留作回滚用。

### 附带的缓存开关
Worker 自身的 Cache API 里存着故障期间产生的 24 小时 404，
而缓存键不含源站地址、也无法用 zone 的 `purge_cache` 清除（那是 Worker 私有缓存）。
因此新增绑定 `ENABLE_CACHE_API = "false"` 关闭该缓存（源站是 Pages，本身已有 CDN 缓存）。

## 绑定说明（deploy.ps1 会原样保留）

| 绑定 | 类型 | 用途 |
| --- | --- | --- |
| `REGIONS` | plain_text | 各地区源站与缓存策略（JSON） |
| `SITE_URL` | plain_text | 源站地址 |
| `REGIONAL_ASSETS` | r2_bucket | 区域预渲染页面（bucket `h5-game-assets`） |
| `GAME_KV` | kv_namespace | KV 存储 |
| `PRERENDERED_PATHS` | plain_text | 优先从 R2 读取的路径列表 |
| `ENABLE_CACHE_API` | plain_text | `false` = 关闭 Worker 私有缓存（**已删除该绑定 = 缓存开启**） |
| 其余 | plain_text | `DEFAULT_REGION` / `GEO_POOLS` / `REGION_MAPPING` / `DEPLOY_VERSION` / `API_BYPASS_PATHS` / 缓存 TTL 等 |

## 第二轮修复（2026-11-04，恢复缓存 + 地区预渲染）

### ① `addLinkHeaders` 未定义 → 缓存命中即 500

缓存 HIT 分支调用了 `addLinkHeaders(...)`，但**模块里根本没有这个函数**：

```
ReferenceError: addLinkHeaders is not defined at Object.fetch (index.js:1276:11)
```

Worker 未捕获异常 → Cloudflare 返回 **1101**。表现是「第一次访问正常、第二次 500」——
因为 MISS 时走的是源站分支（那里是内联实现），HIT 时才走缺失的函数。
已补上与源站分支一致的 hreflang `Link` 头实现（并用 `try/catch` 兜底）。

顺带修掉源站分支的同一处隐患：`X-Forwarded-Proto` 不含冒号，拼出来是 `https//host/...`，
现统一改用 `url.protocol`（`https:`）→ `https://host/...`。

### ② 缓存键加版本前缀

原缓存键 `region__device__lang__path` **不含源站/版本**，导致：
- 源站变更后旧缓存无法自动失效；
- 故障期缓存的 404 无法清除（Worker 私有缓存，zone 级 `purge_cache` 清不掉）。

现改为 `v7__region__device__lang__path`。**改内容后 bump 版本号即可一次性作废旧缓存**。

### ③ 恢复地区预渲染文件（R2 `h5-game-assets`）

原先 `cn/`、`en/`、`eu/`、`sea/`、`jpkr/`、`global/` 前缀目录整个缺失，
路由只能回源。现按 `tryPrerenderedHtml()` 的取键规则上传 **78 个对象**：

| 键 | 对应 URL | 说明 |
| --- | --- | --- |
| `<region>/index.html` | `/` 与 `/<region>` | 该地区访客看到的首页 |
| `<region>/.html` | `/<region>/` | 带斜杠形式 |
| `<region>/about.html` 等 | `/<region>/about` | 地区前缀下的子页面 |
| `<visitor>/<region>/.html` | `/<region>/`（其他地区访客） | 保证 hreflang 里公布的地址都能打开 |

上传脚本：`upload-prerender.ps1`（幂等，直接覆盖 R2 对象）。
上传前会把站内链接改成**根绝对路径**（`assets/…` → `/assets/…`、`games/slots.html` → `/games/slots`），
否则在 `/<region>/` 下相对路径会 404、样式全丢。
地区专属文案可以**直接改 R2 对象**、无需重新部署——这正是预渲染的意义。

### ⑤ 地区落地页本地化（en / sea / global / eu / jpkr）

`REGION_MAPPING` 把访客国家映射到 6 个地区，因此给每个地区准备一份对应语言的落地页：

| 地区 | 覆盖国家 | 落地页 | 语言 |
| --- | --- | --- | --- |
| `cn` | CN / HK / TW | `index.html`（站点自带） | 简体中文 |
| `sea` | SG / MY / TH / VN / ID / PH / IN | `locales/index.en.html` | English |
| `en` | US / CA / GB / AU / NZ | `locales/index.en.html` | English |
| `global` | 其它所有国家 | `locales/index.en.html` | English |
| `eu` | DE / FR / NL / ES / IT | `locales/index.de.html` | Deutsch |
| `jpkr` | JP / KR | `locales/index.ja.html` | 日本語 |

三份本地化页面在 `infra/geo-router/locales/` 下，结构与中文版完全一致（复用同一套
`assets/css/main.css` 的 class），只替换文案与 `<html lang>` / `og:locale` / JSON-LD `inLanguage`：

- `<title>` / `description` / `keywords` / `og:*` / `twitter:*` 全部本地化；
- JSON-LD 仍是 `WebSite` + `Organization` + `FAQPage` 三段，FAQ 问答逐条翻译；
- 品牌名保留中文「星悦轻量娱乐场」（不臆造英文/德文/日文品牌），仅描述性文案本地化；
- `canonical` 仍指向 `https://casino.vip01.cc.cd/`（镜像域名的统一归一策略）。

上传脚本按地区选择落地页；交叉键 `<visitor>/<target>/.html` 放的是 **target 地区**的落地页，
所以任何访客访问 `/<region>/` 拿到的都是该地区语言的内容。

> 子页面（`about` / `hub` / `games/*`）目前仍是中文版，各地区共用。
> 要本地化同样只需新增一份语言文件 + 在脚本里加映射，无需改 Worker 代码。

## 第四轮修复（2026-11-04，Phaser 游戏合集 + 元数据一致性）

### ① 把 R2 里 101 款 Phaser 开源游戏重新上线

R2 `h5-game-assets/phaser/` 里有 **101 款基于 Phaser 3 的开源经典游戏复刻**
（射箭、2048、贪吃蛇、扫雷、俄罗斯方块、坦克大战……），每款都是自包含的单个 HTML 文件，
但 `PRERENDERED_PATHS` 里没有它们、原来的 Pages 源站也已删除 → **这批内容一直是访问不到的**。

新增 `arcade/` 目录：

| 文件 | 作用 |
| --- | --- |
| `arcade/build-hub.mjs` | 扫描游戏目录，从每个游戏自带的 `<title>` / `<h1>` / `description` 解析出中英文名与图标，自动分四大类（体育 26 / 棋牌 12 / 益智 23 / 街机 40），生成 `phaser/index.html` 合集页（含 CollectionPage + ItemList 结构化数据） |
| `arcade/publish.ps1` | 从 R2 同步 `phaser/*.html` → 生成合集页 → 打包站点文件 → 用 wrangler 部署到 Pages（`h5games-3hm` / `casino-game` / `my-slot-game` 三个项目） |
| `arcade/patch-lang.mjs` | Worker 补丁：注入的语言元数据跟随**内容地区**而不是访客地区 |
| `arcade/patch-contentregion.mjs` | Worker 补丁：同上（内容地区推导） |

上线后：

- `https://casino.vip01.cc.cd/phaser/` 与任意镜像域名 `/phaser/` 都能打开合集页；
- 101 款游戏各自可玩（`/phaser/phaser-archery`）；
- 全部写进 `sitemap.xml`（合集页 + 101 条游戏 URL，仓库与线上由脚本保持同步）；
- `hub.html` 增加「站内内容」区块指向 `/phaser/`。

> Pages 会把 `foo.html` 308 跳到 `foo`，所以合集页链接与 sitemap 一律用**无扩展名**形式。

### ② 注入的 `geo-language` 改为跟随「内容地区」

原来注入用**访客识别到的地区**：

```
/eu/   -> html lang=de    geo-language=en     ✗
/jpkr/ -> html lang=ja    geo-language=en     ✗
```

hreflang 头公布的正是 `/jpkr/`、`/eu/` 这类地区前缀 URL，爬虫抓到的却是「英文」标注——
恰好把最该被正确标注的页面标错。

改为按**实际服务的 R2 键**推导内容地区：

```
"<region>/index.html"        -> region
"<region>/games/<page>.html" -> region        （第二段不是地区名）
"<visitor>/<target>/.html"   -> target        （第二段是地区名）
```

修正后：

| URL | html lang | geo-region | geo-language |
| --- | --- | --- | --- |
| `/cn/` | zh-CN | cn | zh-CN |
| `/en/` | en | en | en |
| `/eu/` | de | eu | de |
| `/jpkr/` | ja | jpkr | ja |
| `/` | 访客地区 | 访客地区 | 访客地区 |

### ③ 不再注入重复的 WebSite 实体

本地化落地页自带完整的 `WebSite` / `Organization` / `FAQPage` 三段结构化数据，
Worker 再注入一份 `WebSite` 会产生**两个互相冲突的站点实体**（名称、url、inLanguage 都不同）。
现在只有当页面**自己没声明** WebSite 实体时才注入（合集页、游戏页仍然会拿到）。

### ④ 删除占位 A 记录

`vip01.cc.cd` 上三条指向 `192.0.2.1`（TEST-NET-1 文档保留地址）的占位记录已全部删除：
`vip-*`、`slot.`、`luckyarcade.`。改由通配 CNAME `*.vip01.cc.cd → my-slot-game.pages.dev` 接管。

- `vip-NN.vip01.cc.cd` —— sitemap 里的 1050 条落地页入口，仍返回 200；
- `luckyarcade.vip01.cc.cd` —— 有专属 Worker 路由 `luckyarcade.vip01.cc.cd/* → lucky-arcade`，
  路由优先级高于通配，行为不变（仍返回幸运街机站点）；
- `slot.vip01.cc.cd` —— 无专属路由，与其它通配子域一样由 geo-router 处理。

> 若希望 `slot.` 真正成为老虎机站的别名，把它改成 CNAME 指向
> `slotmachine-casino.pages.dev` 即可（`slotmachine.vip01.cc.cd` 就是这么配的）。

## 第三轮修复（2026-11-04，定时任务）

`scheduled` 任务原本按地区循环发请求：

```
6 个地区 × (1 次 /health + len(PRERENDERED_PATHS)=8 次预热) = 54 次子请求
```

**超过免费套餐单次调用 50 次子请求的上限**，tail 日志里最后一个地区每次都报
`Too many subrequests by single Worker invocation`（该地区实际从未被预热）。

现改为**每地区 1 次请求**（健康检查打源站根路径并顺带完成预热），共 6 次子请求：

- 预热对象从 `prerenderedPaths` 全部路径改为源站根路径 `/`——因为地区落地页现在
  由 R2（`REGIONAL_ASSETS`）提供，再去预热源站已无意义；
- 健康检查从 `/health`（Pages 源站没有这个端点，永远 404）改为 `/`，日志才有判断价值；
- 保留 5 秒超时，异常仍会被捕获并打印。

## 已知问题（未处理，供后续参考）

- 定时任务的预热打的是**源站**，对 Worker 私有缓存无效（Worker 缓存按
  `region__device__lang__path` 分键，cron 不知道访客的设备/语言）。
  想真正预热 Worker 缓存，需要 cron 去请求 Worker 自己的公网地址并带上对应 UA/语言头。
- `PRERENDERED_PATHS` 绑定现在只在 cron 里用过一次；改预热策略后它就不再被引用，
  可以保留作配置说明。

## 重新发布

```powershell
$env:CLOUDFLARE_API_TOKEN  = "<token>"
$env:CLOUDFLARE_ACCOUNT_ID = "33717d3e6845f08352ee14d9d672e273"
powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/deploy.ps1
```

脚本会先从 API 读取现有绑定再覆盖，避免丢失 KV / R2 绑定。
需要移除某个绑定时加 `-RemoveBinding <名称>`（例如关闭缓存）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/deploy.ps1 -RemoveBinding ENABLE_CACHE_API
```

上传地区预渲染文件：

```powershell
$env:R2_ACCESS_KEY_ID     = "<access key id>"
$env:R2_SECRET_ACCESS_KEY = "<secret access key>"
powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/upload-prerender.ps1
```

> 上传 Worker 必须用 **multipart**，且模块名要等于上传文件名（`index.js`）并与 `main_module` 一致；
> `main_module` 必须是 ESM（`export default`）。用 `PATCH .../bindings` 改绑定会返回
> 405（该 token 不支持），只能整包重传。
> metadata 必须走文件（`-F "metadata=<_meta.json;type=application/json"`），
> 否则 PowerShell 原生参数会吃掉 JSON 的双引号。
