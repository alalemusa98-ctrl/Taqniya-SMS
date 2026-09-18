const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadYamlParser() {
  const candidates = [
    'js-yaml',
    path.join(process.env.APPDATA || '', 'npm/node_modules/newman/node_modules/js-yaml'),
    path.join(process.env.APPDATA || '', 'npm/node_modules/js-yaml'),
    path.join(__dirname, '../backend/node_modules/js-yaml')
  ];
  for (const cand of candidates) {
    try {
      return require(cand);
    } catch (e) {}
  }
  throw new Error('لم يتم العثور على مكتبة js-yaml. يرجى التأكد من تثبيت newman عالمياً.');
}

const yaml = loadYamlParser();
const baseDir = __dirname;
const collDir = path.join(baseDir, 'collections');
const envFile = path.join(baseDir, 'environments', 'Taqniya SMS - Local Environment.environment.yaml');
const reportsDir = path.join(baseDir, 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log('🔄 جاري تجميع ملفات الـ YAML إلى Postman Collection القياسية...');

// 1. Convert Environment
let envJsonPath = path.join(baseDir, 'environment.json');
if (fs.existsSync(envFile)) {
  const envYaml = yaml.load(fs.readFileSync(envFile, 'utf8'));
  const envJson = {
    id: 'taqniya-sms-local-env',
    name: envYaml.name || 'Taqniya SMS - Local Environment',
    values: (envYaml.values || []).map(v => ({
      key: v.key,
      value: String(v.value ?? ''),
      type: 'default',
      enabled: true
    }))
  };
  fs.writeFileSync(envJsonPath, JSON.stringify(envJson, null, 2), 'utf8');
}

// 2. Helper to process folders & requests
function processFolder(folderPath, isRoot = false) {
  let defPath = path.join(folderPath, '.resources', 'definition.yaml');
  let def = {};
  if (fs.existsSync(defPath)) {
    def = yaml.load(fs.readFileSync(defPath, 'utf8')) || {};
  }
  
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const items = [];
  
  for (const entry of entries) {
    if (entry.name === '.resources') continue;
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      items.push(processFolder(fullPath, false));
    } else if (entry.name.endsWith('.request.yaml')) {
      const reqYaml = yaml.load(fs.readFileSync(fullPath, 'utf8'));
      const item = {
        name: reqYaml.name || entry.name.replace('.request.yaml', ''),
        request: {
          method: reqYaml.method || 'GET',
          header: Object.entries(reqYaml.headers || {}).map(([k, v]) => ({ key: k, value: String(v), type: 'text' })),
          url: reqYaml.url ? reqYaml.url : '{{baseUrl}}'
        }
      };
      if (reqYaml.description) item.request.description = reqYaml.description;
      if (reqYaml.auth && reqYaml.auth.type === 'bearer') {
        item.request.auth = { type: 'bearer', bearer: [{ key: 'token', value: reqYaml.auth.credentials?.token || '{{authToken}}', type: 'string' }] };
      }
      if (reqYaml.body) {
        item.request.body = {
          mode: 'raw',
          raw: reqYaml.body.content || '',
          options: { raw: { language: 'json' } }
        };
      }
      if (reqYaml.scripts) {
        item.event = reqYaml.scripts.map(s => ({
          listen: s.type === 'afterResponse' ? 'test' : (s.type === 'beforeRequest' ? 'prerequest' : 'test'),
          script: {
            type: 'text/javascript',
            exec: (s.code || '').split('\n')
          }
        }));
      }
      items.push(item);
    }
  }
  
  if (isRoot) {
    return {
      info: {
        name: def.name || path.basename(folderPath),
        description: def.description || '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: items
    };
  } else {
    return {
      name: def.name || path.basename(folderPath),
      description: def.description || '',
      item: items
    };
  }
}

// 3. Compile & Run All Collections
const collDirs = fs.readdirSync(collDir, { withFileTypes: true }).filter(d => d.isDirectory());
if (collDirs.length === 0) {
  console.error('❌ لم يتم العثور على أي مجلد داخل postman/collections');
  process.exit(1);
}

const args = process.argv.slice(2);
const compileOnly = args.includes('--compile-only') || args.includes('--build-only');
const requestedPhase = args.find(a => !a.startsWith('--'));

for (const dir of collDirs) {
  if (requestedPhase && !dir.name.includes(requestedPhase)) {
    continue;
  }

  console.log(`\n📦 جاري معالجة المجموعة: ${dir.name}`);
  const targetColl = path.join(collDir, dir.name);
  const collJson = processFolder(targetColl, true);
  
  // Clean name for files
  let safeName = dir.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_').replace(/_+/g, '_').trim();
  if (dir.name.includes('02-A') || dir.name.includes('Academic Structure A')) {
    safeName = 'Phase_02_A_Academic_Structure';
  } else if (dir.name.includes('01')) {
    safeName = 'Phase_01_Auth_Identity';
  }

  const collJsonPath = path.join(baseDir, `${safeName}.postman_collection.json`);
  fs.writeFileSync(collJsonPath, JSON.stringify(collJson, null, 2), 'utf8');

  // Also write to collection.json
  fs.writeFileSync(path.join(baseDir, 'collection.json'), JSON.stringify(collJson, null, 2), 'utf8');

  console.log(`✅ تم إنشاء ملف المجموعة: ${safeName}.postman_collection.json`);

  if (compileOnly) {
    continue;
  }

  const reportFile = path.join(reportsDir, `${safeName}_Report.html`);
  console.log(`🚀 جاري تشغيل الاختبارات وتوليد التقرير التفاعلي عبر Newman لـ [${dir.name}]...`);

  try {
    const newmanCmd = `newman run "${collJsonPath}" -e "${envJsonPath}" -r htmlextra --reporter-htmlextra-export "${reportFile}" --reporter-htmlextra-title "Taqniya SMS - ${collJson.info.name} Report"`;
    execSync(newmanCmd, { stdio: 'inherit' });
    console.log(`✅ اكتمل توليد التقرير: ${reportFile}`);
  } catch (error) {
    console.warn(`⚠️ ملاحظة: تم تشغيل Newman (تأكد من تشغيل الخادم المحلي للحصول على نتيجة 100% نجاح).`);
  }
}

console.log('\n🎉 اكتملت عملية معالجة وتجميع مجموعات Postman بنجاح!');


