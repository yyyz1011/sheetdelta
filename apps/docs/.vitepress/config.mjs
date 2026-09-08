import { defineConfig } from 'vitepress';
const origin = 'https://sheetdelta.snowy-hero-3539.chatgpt.site';
const repo = 'https://github.com/yyyz1011/sheetdelta';
const sidebar = (zh = false) => {
  const p = zh ? '/zh/' : '/';
  return [
    { text: zh ? '开始使用' : 'Getting started', items: [
      { text: zh ? '介绍' : 'Introduction', link: p },
      { text: zh ? '快速开始' : 'Quick start', link: p + 'quick-start' },
      { text: zh ? '浏览器工具' : 'Browser tool', link: p + 'browser-tool' },
    ] },
    { text: zh ? '核心概念' : 'Core concepts', items: [
      { text: zh ? '键与字段映射' : 'Keys & column mapping', link: p + 'mapping' },
      { text: zh ? '比较规则' : 'Comparison rules', link: p + 'comparison' },
      { text: zh ? '校验与错误处理' : 'Validation & errors', link: p + 'validation' },
    ] },
    { text: zh ? 'API 参考' : 'API reference', items: [
      { text: 'compareTables', link: p + 'api/compare-tables' },
      { text: 'exportDiffCsv', link: p + 'api/export-diff-csv' },
      { text: zh ? '常见问题' : 'FAQ', link: p + 'faq' },
    ] },
  ];
};
export default defineConfig({
  title: 'SheetDelta', description: 'Compare tables by identity, not row position. Documentation for sheetdelta-core.',
  base: '/docs/', lang: 'en-US', cleanUrls: false,
  // VitePress passes this value to VueUse and its pre-paint script. Explicit light ignores OS dark mode on first visit.
  appearance: { initialValue: 'light' },
  head: [['link', { rel: 'icon', href: '/docs/logo.svg' }], ['meta', { name: 'theme-color', content: '#ffffff' }]],
  sitemap: { hostname: origin + '/docs/' },
  locales: {
    root: { label: 'English', lang: 'en-US', themeConfig: { sidebar: sidebar(), nav: [{ text: 'Documentation', link: '/' }, { text: 'npm', link: 'https://www.npmjs.com/package/sheetdelta-core' }], outline: { label: 'On this page', level: [2, 3] } } },
    zh: { label: '简体中文', lang: 'zh-CN', description: '按唯一键比较表格，准确识别新增、删除与修改。sheetdelta-core 中文文档。', themeConfig: { sidebar: sidebar(true), nav: [{ text: '文档', link: '/zh/' }, { text: 'npm', link: 'https://www.npmjs.com/package/sheetdelta-core' }], outline: { label: '本页内容', level: [2, 3] }, docFooter: { prev: '上一页', next: '下一页' }, sidebarMenuLabel: '菜单', returnToTopLabel: '返回顶部', darkModeSwitchLabel: '主题', lightModeSwitchTitle: '切换到浅色模式', darkModeSwitchTitle: '切换到深色模式', langMenuLabel: '切换语言', editLink: { pattern: repo + '/edit/master/apps/docs/:path', text: '在 GitHub 上编辑此页' } } },
  },
  themeConfig: {
    logo: '/logo.svg', siteTitle: 'SheetDelta', externalLinkIcon: true,
    socialLinks: [{ icon: 'github', link: repo }],
    editLink: { pattern: repo + '/edit/master/apps/docs/:path', text: 'Edit this page on GitHub' },
    search: { provider: 'local', options: { miniSearch: { options: { tokenize: (text) => text.match(/[a-zA-Z0-9_]+|[\u4e00-\u9fff]/g) || [] }, searchOptions: { combineWith: 'AND' } }, locales: { zh: { translations: { button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' }, modal: { displayDetails: '显示详情', resetButtonTitle: '清除搜索', backButtonTitle: '返回', noResultsText: '没有找到相关内容', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } } } } } } },
  },
  markdown: { theme: { light: 'github-light', dark: 'github-dark' }, lineNumbers: false },
});
