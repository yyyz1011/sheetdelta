import DefaultTheme from 'vitepress/theme-without-fonts';
import { h } from 'vue';
import NavPreferences from './NavPreferences.vue';
import '@fontsource-variable/manrope';
import './custom.css';
export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-content-after': () => h(NavPreferences),
  }),
};
