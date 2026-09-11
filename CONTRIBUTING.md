# Contributing

## Release changelog

For each npm release, add an entry to `scripts/releases.json` with the intended version, GitHub release URL, UTC release date, English/Chinese highlights and a related guide. Run `npm run docs:changelog` and commit the generated pages. The docs build regenerates both language indexes and version pages; navigation reads the same release list. Only record released behavior, and verify the version/date after publication. Documentation-only changes do not require an npm release.
