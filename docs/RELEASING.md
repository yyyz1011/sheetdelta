# GitHub → npm 自动发布

仓库：<https://github.com/yyyz1011/sheetdelta>，默认分支 `master`。npm 包：`sheetdelta-core`，工作区：`packages/core`。网站不包含在 npm 发布包里。

## 日常维护

1. 从 `master` 创建功能分支，修改并提交，然后创建 PR。
2. PR 运行单元测试、类型检查、网站构建、浏览器回归、npm 打包检查，并在独立项目中安装压缩包验证导入和运行。
3. 用 squash 合并到 `master`，保持 PR 标题为 Conventional Commits 格式。
4. Release 工作流再次测试，通过后由 semantic-release 自动计算版本、发布 npm、打 Git 标签、生成 GitHub Release。

| 合并提交 | npm 结果 |
| --- | --- |
| `fix(core): 修复重复键判断` | patch，例如 0.1.0 → 0.1.1 |
| `feat(core): 添加新比较选项` | minor，例如 0.1.1 → 0.2.0 |
| 正文包含 `BREAKING CHANGE: 不兼容说明` | major，例如 0.2.0 → 1.0.0 |
| `docs: ...`、`test: ...`、`ci: ...`、`chore: ...` | 不发布 |
| `feat(web): ...`、`fix(web): ...` 或 `no-release` scope | 不发布 |

没有符合规则的提交就不会发布。不要只在标题写 `!`：当前 angular 解析器要求破坏性变更在正文写 `BREAKING CHANGE:`。不要手改版本号或重复发布已存在的版本。

包在源代码中的版本是初始开发版本；semantic-release 在 runner 内更新打包版本，已发布版本以 npm 和 Git 标签为准，不把生成的版本提交回 master。网站工作区继续引用本地核心。无需维护 CHANGELOG 副本，变更记录在 GitHub Releases。

## 首次启用（本仓库已完成）

- 维护者先完成 npm 2FA 配置；仅网页登录不足以授权首次发布。
- 用维护者 npm 账号手动发布 `0.1.0`，确认 registry 可安装，再推送对应 `v0.1.0` 标签。
- 通过 npm CLI 添加绑定：`npx npm@11.19.1 trust github sheetdelta-core --file publish.yml --repo yyyz1011/sheetdelta --allow-publish --yes`。也可在包 Settings → Trusted Publishers 查看和管理，environment 留空。
- 验证绑定后设置仓库 Actions variable `NPM_TRUSTED_PUBLISHING=true`。
- 通过一项真实修复的 PR 验证自动发布。未启用变量时测试照常运行，publish job 跳过。

使用 GitHub 托管的 Ubuntu runner、Node.js 24 和支持 OIDC 的 npm。`publish.yml` 只给发布 job `id-token: write` 和 `contents: write`；不用长期 NPM_TOKEN。公开仓库产生 npm provenance。绑定必须与 `repository.url` 和工作流文件名一致。

## 排障与暂停

- 查看 GitHub Actions → Release；测试失败时不会进入发布。
- OIDC 身份失败：检查包名、npm 绑定 owner/repository/workflow、仓库变量和 runner。
- 临时暂停：把 `NPM_TRUSTED_PUBLISHING` 改为 `false`，测试仍保留。
- 修复流水线后可在 Actions 手动运行 Release；semantic-release 根据已发布标签判断是否还有待发布提交。
- 如果 npm 已成功而后续 GitHub Release 失败，先核对 npm 和 tags，恢复缺少的发布记录，不重新发布同版本。

`master` 已启用分支保护，必须经 PR 并通过 `Tests and build`；维护者也适用。仓库只允许 squash 合并，合并信息默认保留 PR 标题和正文。

官方说明：<https://docs.npmjs.com/trusted-publishers/>。

## 首次联调记录（2026-09-09）

- 手动发布 `0.1.0` 后推送 `v0.1.0`，并启用可信发布。
- [PR #1](https://github.com/yyyz1011/sheetdelta/pull/1) 修复 `npm pack` 不自动构建的问题；通过检查后 squash 合并到 master。
- [Release 工作流](https://github.com/yyyz1011/sheetdelta/actions/runs/34261924964) 测试和发布均成功；自动发布 `0.1.1`，生成 [GitHub Release](https://github.com/yyyz1011/sheetdelta/releases/tag/v0.1.1)。
- npm registry 返回 `0.1.1` 与 SLSA provenance；独立临时项目从 registry 安装后，导入、比较及 CSV 导出验证通过。
- 24 项单元测试、6 项浏览器测试、打包后独立消费者检查均通过。版本规则另验证了 patch、minor、major、网站改动跳过、文档改动跳过。
