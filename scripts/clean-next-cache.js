const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const targets = [
  path.join(root, 'apps', 'web', '.next'),
  path.join(root, 'apps', 'web', 'node_modules', '.cache'),
];
for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`removed ${target}`);
  } catch (error) {
    console.warn(`skip ${target}: ${error.message}`);
  }
}
