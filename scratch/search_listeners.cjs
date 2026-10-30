const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    if (fs.statSync(full).isDirectory()) search(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      content.split('\n').forEach((l, i) => {
        if (/visibilitychange|addEventListener\s*\(\s*['"](focus|visibilitychange)/i.test(l)) {
          console.log(full + ':' + (i+1) + ': ' + l.trim());
        }
      });
    }
  }
}
search('Frontend/school-management-system/src');
