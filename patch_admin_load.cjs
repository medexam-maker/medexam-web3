const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// replace the loadAdminData Promise.all completely
code = code.replace(
  /const \[qRes, sRes, stRes, spRes, prRes\] = await Promise\.all\(\[[^\]]+\]\);/,
  `const [qRes, sRes, stRes, spRes, prRes, arRes] = await Promise.all([
         authFetch('/api/questions'),
         authFetch('/api/subscriptions/pending'),
         authFetch('/api/admin/stats'),
         authFetch('/api/specialties/status'),
         authFetch('/api/proctoring/reports'),
         authFetch('/api/admin/releases')
       ]);`
);

code = code.replace(
  "if (prRes.ok) {",
  `if (arRes && arRes.ok) {
        const arData = await arRes.json();
        if (arData && arData.releases) {
          setAndroidReleases(arData.releases);
        }
      }
      if (prRes.ok) {`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Patched AdminPanel loadAdminData');
