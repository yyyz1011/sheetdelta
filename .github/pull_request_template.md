## 改动

说明触发场景和改动后的行为。

## 验证

- [ ] `npm run check`
- [ ] 涉及界面时运行 `npm run test:e2e`

合并时使用 squash，并保留规范标题：`fix(core): ...` 发补丁版，`feat(core): ...` 发功能版，破坏性变更在正文写 `BREAKING CHANGE: ...`。网站改动用 `feat(web): ...` / `fix(web): ...`，文档用 `docs: ...`，这些不触发 npm 发布。
