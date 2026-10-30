const fs = require('fs');
const content = fs.readFileSync('Frontend/school-management-system/src/App.tsx', 'utf8');
content.split('\n').forEach((l, i) => {
  if (l.includes('SettingsView') || l.includes('settings')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
