const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('A pull request title is required.');
  process.exit(1);
}

const conventionalTitle = /^(feat|fix|perf|refactor|docs|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9-]*\))?!?: .+/;

if (!conventionalTitle.test(title)) {
  console.error(`Invalid pull request title: "${title}"`);
  console.error('Use a Conventional Commit title, for example: feat(core): add import sessions');
  process.exit(1);
}

console.log(`Valid pull request title: "${title}"`);
