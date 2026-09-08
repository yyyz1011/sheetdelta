<script setup lang="ts">
import { computed } from 'vue';
import { useData, useRoute, withBase } from 'vitepress';

const { isDark, localeIndex, page } = useData();
const route = useRoute();
const isChinese = computed(() => localeIndex.value === 'zh');
const languageHref = computed(() => {
  const path = page.value.relativePath.replace(/^zh\//, '')
    .replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html');
  return withBase(`/${isChinese.value ? '' : 'zh/'}${path}`) + route.query + route.hash;
});
const themeLabel = computed(() => isChinese.value
  ? (isDark.value ? '切换为白天模式' : '切换为黑夜模式')
  : (isDark.value ? 'Switch to light mode' : 'Switch to dark mode'));
</script>

<template>
  <div class="nav-preferences">
    <a class="nav-preference language-preference" :href="languageHref"
      :lang="isChinese ? 'en' : 'zh-CN'" :hreflang="isChinese ? 'en' : 'zh-CN'"
      rel="alternate" :aria-label="isChinese ? 'Switch to English' : '切换为简体中文'"
      :title="isChinese ? 'Switch to English' : '切换为简体中文'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M3 5h12M9 2v3M5 5c0 5 4 9 8 11M13 5c0 5-4 9-9 11M13 22l5-12 5 12M15 18h6" />
      </svg>
      <span>{{ isChinese ? 'EN' : '中文' }}</span>
    </a>
    <button class="nav-preference theme-preference" type="button"
      :aria-label="themeLabel" :title="themeLabel" @click="isDark = !isDark">
      <svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" />
      </svg>
      <svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M20.8 13a9 9 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z" />
      </svg>
    </button>
  </div>
</template>
