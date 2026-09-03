const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Add 'releases' to activeTab state type
code = code.replace(
  "| 'audit' | 'blog'",
  "| 'audit' | 'blog' | 'releases'"
);

// 2. Add Smartphone icon import
code = code.replace(
  'FileCheck2,',
  'FileCheck2, Smartphone,'
);

// 3. Add AndroidRelease import
code = code.replace(
  'CouncilInfo } from',
  'CouncilInfo, AndroidRelease } from'
);

// 4. Add releases state
code = code.replace(
  'const [blogPosts, setBlogPosts] = useState<any[]>([]);',
  'const [blogPosts, setBlogPosts] = useState<any[]>([]);\n  const [androidReleases, setAndroidReleases] = useState<AndroidRelease[]>([]);'
);

// 5. Add load function in loadAdminData
code = code.replace(
  "authFetch('/api/proctoring/reports')",
  "authFetch('/api/proctoring/reports'),\n        authFetch('/api/admin/releases')"
);

code = code.replace(
  "setProctoringReports(prData.reports);",
  "setProctoringReports(prData.reports);\n        }\n      }\n      const arRes = arguments[0]?.[5] || (await Promise.all([authFetch('/api/admin/releases')]))[0];\n      if (arRes && arRes.ok) {\n        const arData = await arRes.json();\n        if (arData && arData.releases) {\n          setAndroidReleases(arData.releases);\n        }"
);
// Wait, the destructuring of Promise.all in loadAdminData is specific, let me just add a new fetch inside the try block.
