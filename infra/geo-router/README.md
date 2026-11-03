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
| `ENABLE_CACHE_API` | plain_text | `false` = 关闭 Worker 私有缓存 |
| 其余 | plain_text | `DEFAULT_REGION` / `GEO_POOLS` / `REGION_MAPPING` / `DEPLOY_VERSION` / `API_BYPASS_PATHS` / 缓存 TTL 等 |

## 重新发布

```powershell
$env:CLOUDFLARE_API_TOKEN  = "<token>"
$env:CLOUDFLARE_ACCOUNT_ID = "33717d3e6845f08352ee14d9d672e273"
powershell -NoProfile -ExecutionPolicy Bypass -File infra/geo-router/deploy.ps1
```

脚本会先从 API 读取现有绑定再覆盖，避免丢失 KV / R2 绑定。

> 上传 Worker 必须用 **multipart**，且模块名要等于上传文件名（`index.js`）并与 `main_module` 一致；
> `main_module` 必须是 ESM（`export default`）。用 `PATCH .../bindings` 改绑定会返回
> 405（该 token 不支持），只能整包重传。
