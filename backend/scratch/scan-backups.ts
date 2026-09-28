import * as fs from 'fs';
import * as path from 'path';

function scan(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scan(full);
    } else {
      console.log(full, `(${fs.statSync(full).size} bytes)`);
    }
  }
}

console.log('--- Storage Backups ---');
scan(path.resolve(process.cwd(), 'storage/backups'));
scan(path.resolve(process.cwd(), '../storage/backups'));
