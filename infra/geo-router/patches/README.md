# 已应用的补丁（一次性脚本）

这两个脚本记录了 2026-11-04 对 `h5-game-geo-router` 的两处源码改动，
**改动已经写进 `../h5-game-geo-router.js`**，脚本仅作留档与复现用。

| 脚本 | 作用 |
| --- | --- |
| `01-inject-language-region.mjs` | ① 注入的 description / inLanguage / geo-language 增加 `eu → de` 分支；② 页面自带 WebSite 实体时不再重复注入第二个 |
| `02-content-region.mjs` | 注入的元数据改为跟随**实际服务的 R2 键**（内容地区），而不是访客识别到的地区 |

两者都是**幂等失败**的：补丁已经打上后再跑会直接报错退出，不会二次改坏源码
（`01` 的匹配模式在打完后不再成立，`02` 的目标字符串只出现一次）。

> 跑之前请先备份 `../h5-game-geo-router.js`，并用 `node --check` 校验语法。
