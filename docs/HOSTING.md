# Documentation hosting

Production: https://sheetdelta.nimokit.com/docs/

Chinese: https://sheetdelta.nimokit.com/docs/zh/

Browser tool: https://sheetdelta.nimokit.com/playground/

## Architecture

GitHub Pages serves the static site from the public `yyyz1011/sheetdelta` repository. VitePress generates English and Chinese HTML and local search indexes. The default locale is English and the default appearance is light; saved language and theme choices still apply. Translated pages share paths beneath `zh/`.

`npm run site:build` builds the library, the browser tool at `/playground/`, and documentation at `/docs/`. `scripts/assemble-site.mjs` combines them into `dist/`, including the root redirect, a root 404 page, robots.txt, and a `.nojekyll` marker. The root 404 uses the documentation layout and absolute `/docs/` asset links. No server, database, runtime secrets, or Sites project is required.

## Automatic updates

1. Edit the Markdown and its Chinese counterpart. Theme and navigation live in `apps/docs/.vitepress/`. To change generated API documentation, edit its catalog/generator and run `npm run docs:api`.
2. Run `npm run site:build` and `npm run site:check`, then open a PR.
3. After required checks pass, squash merge to `master`.
4. The **Release** workflow calls CI again. After all its checks succeed, it uploads the exact validated `dist/` artifact and deploys it with the **Deploy documentation** job. The **Publish npm** job independently publishes only when commits qualify for a new package version.

Every merge updates the website, including documentation-only commits. A failed check prevents both deployments. npm failure does not block the website, and website failure does not block npm. Releases are serialized to avoid concurrent publication. `workflow_dispatch` on `master` supports manual recovery without publishing a duplicate npm version.

## GitHub configuration

- Repository **Settings → Pages → Build and deployment**: source **GitHub Actions**.
- Custom domain: `sheetdelta.nimokit.com` (configured in Pages settings, not inferred from a CNAME file).
- The deployment job automatically enables **Enforce HTTPS** when the GitHub-managed certificate is approved. It waits up to 45 minutes during initial provisioning, then reports a failure if GitHub is still pending. Re-run the documentation job after the certificate becomes ready. Subsequent deployments return immediately when HTTPS is already enforced.
- Deployment environment: `github-pages`, limited to the protected `master` branch.
- Workflow: `.github/workflows/publish.yml`; validated artifact upload: `.github/workflows/ci.yml`.
- Pages uses the built-in `GITHUB_TOKEN` with `pages: write` and OIDC `id-token: write`. npm keeps its existing trusted publisher bound to `publish.yml`, with no long-lived npm or hosting tokens.

## Domain

In Tencent Cloud DNSPod for `nimokit.com`, keep this record:

| Host | Type | Value |
| --- | --- | --- |
| `sheetdelta` | CNAME | `yyyz1011.github.io.` |

A subdomain CNAME points to the GitHub account host, without the repository name or a URL path. Keep the custom domain set on the repository before changing DNS. GitHub provisions and renews HTTPS; initial certificate issuance and DNS caches can delay migration. Do not remove the Pages domain while DNS still points there.

Official references: [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [Actions deployments](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Verification and recovery

Check **Actions → Release → Deploy documentation** and the `github-pages` environment for the deployed commit. Verify the home page, a direct API URL, the Chinese version, and `/playground/` over HTTPS. Root `/404.html` handles missing routes.

For a failed deployment, rerun failed jobs in the same Release run while its artifact is available. Otherwise run Release manually on `master` to rebuild it. To roll back content, revert the offending change through a PR and merge; the normal checks and deployment apply. Disabling npm via `NPM_TRUSTED_PUBLISHING=false` does not disable documentation deployment.

## Design references

The grouped navigation, on-page outline, language selector, search, and copyable examples follow established documentation patterns seen in [Vite](https://github.com/vitejs/vite), [VitePress](https://github.com/vuejs/vitepress), and [Zod](https://github.com/colinhacks/zod). The content and styling are written for SheetDelta.

The documentation generator is pinned to VitePress `2.0.0-alpha.20`, the current 2.x documentation line. This avoids the old development-server dependencies in 1.6.4. Treat generator upgrades as explicit changes: rebuild and run the route/search/theme checks before updating production. Production serves generated static files, not a Vite development server.
