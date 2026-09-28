import AdmZip from 'adm-zip';
import * as path from 'path';

const zipPath = path.resolve(process.cwd(), 'storage/backups/full/backup_2026-09-28_12-19-16_full.zip');
const zip = new AdmZip(zipPath);
const sql = zip.readAsText('database.sql');
const lines = sql.split('\n');
const insertLines = lines.filter(l => l.includes('INSERT INTO `class_subjects`') || (lines.indexOf(l) > 0 && lines[lines.indexOf(l)-1].includes('INSERT INTO `class_subjects`')));
console.log('Sample SQL from backup:');
console.log(insertLines.slice(0, 5).join('\n'));

// Let's find lines with '"50"' or similar double quotes in numbers
const matched = lines.filter(l => l.includes('\'"'));
console.log('\nMatched double-quoted values in backup:');
console.log(matched.slice(0, 10).join('\n'));
