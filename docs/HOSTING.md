# Documentation hosting

Production: https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/

Chinese: https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/zh/

Browser tool: https://sheetdelta.snowy-hero-3539.chatgpt.site/playground/

## Architecture

VitePress generates English and Chinese static HTML with a local search index. The default root locale is English. Appearance starts in light mode, independently of the OS preference, and stores subsequent choices locally. Every translated page has the same path beneath `zh/` so language switching preserves context.

`npm run site:build` builds the library, the browser tool with `/playground/` as its asset base, and docs with `/docs/` as their base. `scripts/assemble-site.mjs` combines them into `dist/`; the root redirects to English documentation. No server, database, or application secrets are required.

## Update the site

1. Edit Markdown in `apps/docs/` and its Chinese counterpart. Theme and navigation live in `apps/docs/.vitepress/`.
2. Run `npm run site:build` and `npm run site:check`. Required GitHub CI also runs these checks.
3. Merge the PR to `master`.
4. Use the existing Sites project in `.openai/hosting.json`: push the validated source to its source repository, package the static `dist/`, save a version, and deploy it. Reuse the project; do not create a replacement.

npm publishing remains automatic from master. **Sites deployment is a separate operation**, not an npm release side effect. Do not put expiring Sites credentials in GitHub secrets, repository configuration, source, or documentation.

## Design references

The grouped navigation, on-page outline, language selector, search, and copyable examples follow established documentation patterns seen in [Vite](https://github.com/vitejs/vite), [VitePress](https://github.com/vuejs/vitepress), and [Zod](https://github.com/colinhacks/zod). The content and styling are written for SheetDelta.

The documentation generator is pinned to VitePress `2.0.0-alpha.20`, the current 2.x documentation line. This avoids the old development-server dependencies in 1.6.4. Treat generator upgrades as explicit changes: rebuild and run the route/search/theme checks before updating production. Production serves generated static files, not a Vite development server.
