export default {
  branches: ['master'],
  repositoryUrl: 'https://github.com/yyyz1011/sheetdelta.git',
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'angular',
      releaseRules: [{ scope: 'web', release: false }, { scope: 'no-release', release: false }],
    }],
    '@semantic-release/release-notes-generator',
    ['@semantic-release/npm', { pkgRoot: 'packages/core' }],
    ['@semantic-release/github', { successComment: false, failComment: false, failTitle: false }],
  ],
};
