import fs from 'fs';
import { execSync } from 'child_process';

execSync('git fetch --tags');

let latestTag = execSync('git tag --sort=-v:refname')
  .toString()
  .split('\n')
  .find(tag => /^v?\d+\.\d+\.\d+$/.test(tag)) || 'v1.0.0';

if (latestTag.startsWith('v')) latestTag = latestTag.slice(1);

const [major, minor, patch] = latestTag.split('.').map(Number);
const nextVersion = `${major}.${minor}.${patch + 1}`;

const pkgPath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = nextVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

const pluginPath = 'plugin.json';
const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
plugin.Version = nextVersion;
fs.writeFileSync(pluginPath, JSON.stringify(plugin, null, 2));

// eslint-disable-next-line no-undef
console.log(`✔ Updated version to ${nextVersion}`);
