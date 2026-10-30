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
        if (/setInterval|setTimeout|session_timeout|inactivity|idle/i.test(l)) {
          if (!l.includes('setTimeout(resolve') && !l.includes('setTimeout(() => setCopied') && !l.includes('setTimeout(() => setToast') && !l.includes('setTimeout(() => setIs') && !l.includes('setTimeout(() => setLoading')) {
            console.log(full + ':' + (i+1) + ': ' + l.trim());
          }
        }
      });
    }
  }
}
search('Frontend/school-management-system/src');
