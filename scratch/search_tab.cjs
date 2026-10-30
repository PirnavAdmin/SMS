const fs = require('fs');
const path = require('path');

function searchFiles(dir, filter, pattern) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(full, filter, pattern));
    } else if (filter.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      if (pattern.test(content)) {
        results.push(full);
      }
    }
  }
  return results;
}

console.log('visibilitychange matches:');
console.log(searchFiles('Frontend/school-management-system/src', /\.(tsx|ts|jsx|js)$/, /visibilitychange/i));

console.log('focus matches:');
console.log(searchFiles('Frontend/school-management-system/src', /\.(tsx|ts|jsx|js)$/, /addEventListener\(['"]focus/i));

console.log('blur matches:');
console.log(searchFiles('Frontend/school-management-system/src', /\.(tsx|ts|jsx|js)$/, /addEventListener\(['"]blur/i));

console.log('reload matches:');
console.log(searchFiles('Frontend/school-management-system/src', /\.(tsx|ts|jsx|js)$/, /location\.reload/i));

console.log('idle or inactive matches:');
console.log(searchFiles('Frontend/school-management-system/src', /\.(tsx|ts|jsx|js)$/, /idle|inactive/i));

console.log('Certificate Templates / Numbering Rules matches:');
console.log(searchFiles('Frontend/school-management-system/src', /\.(tsx|ts|jsx|js)$/, /Numbering Rules/i));
