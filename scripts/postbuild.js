// Copy Prisma schema + migrations + .env + public + .next/static to standalone output
const fs = require('fs');
const path = require('path');

// scripts/postbuild.js -> /scripts/ -> repo root
const root = path.resolve(__dirname, '..');
const standalone = path.join(root, 'apps', 'web', '.next', 'standalone');
const nextDir = path.join(root, 'apps', 'web', '.next');

if (!fs.existsSync(standalone)) {
  console.error('[postbuild] standalone dir not found:', standalone);
  process.exit(0);
}

const items = [
  { src: path.join(root, 'packages', 'shared', 'prisma'), dst: path.join(standalone, 'packages', 'shared', 'prisma') },
  { src: path.join(root, 'apps', 'web', '.env'),           dst: path.join(standalone, 'apps', 'web', '.env') },
  { src: path.join(root, 'apps', 'web', '.env.production'),dst: path.join(standalone, 'apps', 'web', '.env.production') },
  { src: path.join(root, 'apps', 'web', 'public'),         dst: path.join(standalone, 'apps', 'web', 'public') },
  { src: path.join(nextDir, 'static'),                      dst: path.join(standalone, 'apps', 'web', '.next', 'static') },
];

for (const { src, dst } of items) {
  if (!fs.existsSync(src)) {
    console.log('[postbuild] skip (missing):', path.relative(root, src));
    continue;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true, dereference: true });
  console.log('[postbuild] copied:', path.relative(standalone, dst));
}

console.log('[postbuild] DONE');
