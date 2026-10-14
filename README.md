# 观世界：腾讯云 CloudBase 每日更新版

## 已确认的问题

2026 年 10 月 14 日检查网站 `https://world-htrkswag-d3g8erky722b7e82b.webapps.tcloudbase.com/`：网页和 `news.json` 均能正常访问，但新闻快照停留在 2026 年 10 月 13 日 16:22（北京时间），共 112 条。新闻响应已设置 `no-store, no-cache`，当时不是缓存造成的未更新。

静态托管仅提供上传后的文件，不会执行新闻采集。此前随包附带的是发布到 GitHub Pages 的工作流，它不会更新腾讯云。原 Sites 网站的定时任务也只更新原站自己的数据库。

## 立即恢复最新内容

在 CloudBase 控制台打开本网站的静态托管文件管理，将本包 `dist/news.json` 上传到原 `news.json` 所在目录并覆盖，然后刷新网页。只更新数据无需替换 HTML 或脚本。若覆盖上传后仍显示旧数据，直接访问网站的 `/news.json` 检查 `updated` 字段是否已经变化，再检查托管缓存。

本次已生成 2026 年 10 月 14 日的新闻快照；不同来源网络可达性不同，暂不可用的来源在数据中明确标注，并保留既有记录。

## 长期方案：每天北京时间 08:00 自动采集并发布腾讯云

此源码包已将唯一的工作流改成 **Daily news to Tencent CloudBase**，不会同时发布 GitHub Pages。流程为：采集来源 → 合并历史 → 将历史写回 Git 仓库 → 构建与验证 → 发布 CloudBase → 读回线上 `news.json` 确认更新成功。

1. 在你自己的 GitHub 仓库根目录放入本包全部内容，包括隐藏目录 `.github/`；默认分支使用 `main`。不要上传 `node_modules/`。
2. 到仓库 Settings → Secrets and variables → Actions → New repository secret，填写下列三个项目。环境 ID 请复制 CloudBase 控制台显示的真实值，不要根据网站域名自行推断。

| Secret 名称 | 内容 |
|---|---|
| `TCB_ENV_ID` | 这个网站所属的 CloudBase 环境 ID |
| `TCB_SECRET_ID` | 有权发布该环境静态托管的腾讯云访问密钥 SecretId |
| `TCB_SECRET_KEY` | 对应的 SecretKey |

密钥只填写到 GitHub Secrets，不放到网站文件、源码或聊天里。采用你现有的访问管理规则，为部署账号配置该环境所需权限。

3. 启用仓库 Actions，并允许工作流写入仓库以保存 `public/news.json`。如分支保护限制机器人推送，请按仓库管理规则允许该更新方式。
4. 在 Actions 中选择 **Daily news to Tencent CloudBase**，点击 **Run workflow** 手动验证一次。只有全部步骤成功，且 Verify published news 输出 `verified: true`，才算腾讯云实际更新完成。
5. 后续按 `0 0 * * *`（UTC）触发，对应北京时间每天 08:00；GitHub 调度可能延迟，不保证精确到分钟。推送到 `main` 或手动触发也会更新。

**当前状态：工作流已准备，尚未配置到你的仓库，也尚未取得腾讯云部署授权，因此还没有替你启用或执行腾讯云自动发布。**

如果以后更换网站域名，修改工作流中的 `TCB_SITE_URL`。网页部署路径目前是网站根目录 `/`。

## 不使用 GitHub 时手动更新

安装 Node.js 24，在解压后的项目目录执行：

```sh
npm ci
npm run refresh
npm run check
```

随后上传 `dist/news.json` 覆盖线上同名文件即可。若修改过页面，也要上传完整的 `dist/` 内容。

也可安装 CloudBase CLI 并按官方流程登录，再执行：

```sh
tcb hosting deploy ./dist / -e <控制台中的环境ID>
```

本包默认数据初始合并自本地历史及实际公开 RSS，并非原站线上数据库的完整导出。当前不提供 AI 翻译或深度分析，英文来源保留原文。

## 检查通过的部分与未验证部分

- 已检查线上文件的实际时间、数量与缓存响应。
- 已成功执行新闻采集、静态构建与数据验证。
- 部署目标为已提供的腾讯云网址；没有将私密凭据写进包中。
- 腾讯云登录与自动发布需要你配置 Secrets；本地无法替代这一步验证。

官方参考：[CloudBase 与 Git 平台 CI/CD 集成](https://docs.cloudbase.net/hosting/cli-devops)、[CloudBase CLI 登录](https://docs.cloudbase.net/cli-v1/install)。
