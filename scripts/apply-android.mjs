// Раскладывает файлы из android-overrides/ по сгенерированному проекту android/.
// Запускать ПОСЛЕ `npx cap add android`. Можно запускать повторно.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'android-overrides');
const dst = path.join(root, 'android');

if (!fs.existsSync(dst)) {
  console.error('Папки android/ нет. Сначала выполните: npx cap add android');
  process.exit(1);
}

// Удаляем то, что Capacitor сгенерировал по умолчанию и что конфликтует с нашими файлами
const main = path.join(dst, 'app', 'src', 'main');
const remove = [
  path.join(main, 'java', 'com', 'amix', 'app', 'MainActivity.java'),
  path.join(main, 'res', 'drawable-v24', 'ic_launcher_foreground.xml'),
  path.join(main, 'res', 'drawable', 'ic_launcher_background.xml'),
];
// старые webp-иконки дали бы ошибку «Duplicate resources» рядом с нашими png
const res = path.join(main, 'res');
if (fs.existsSync(res)) {
  for (const d of fs.readdirSync(res)) {
    if (!d.startsWith('mipmap-')) continue;
    for (const f of fs.readdirSync(path.join(res, d))) {
      if (/^ic_launcher.*\.webp$/.test(f)) remove.push(path.join(res, d, f));
    }
  }
}
for (const f of remove) {
  if (fs.existsSync(f)) { fs.rmSync(f); console.log('удалён   ', path.relative(root, f)); }
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else { fs.copyFileSync(a, b); console.log('скопирован', path.relative(root, b)); }
  }
}
copyDir(src, dst);
console.log('\nГотово. Дальше: npx cap sync android');
