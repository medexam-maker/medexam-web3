const fs = require('fs');
let code = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');

const fetchLogic = `
  const [latestApk, setLatestApk] = useState<any>(null);
  
  useEffect(() => {
    fetch(resolveApiPath('/api/app/latest'))
      .then(res => res.json())
      .then(data => {
        if (data.success && data.release) {
          setLatestApk(data.release);
        }
      })
      .catch(err => console.error('Error fetching latest APK:', err));
  }, []);
`;

code = code.replace(
  'export const HeroSection: React.FC<HeroSectionProps> = ({ onStartExam, siteSettings }) => {',
  `import { resolveApiPath } from '../services/platform';\nimport { useEffect, useState } from 'react';\n\nexport const HeroSection: React.FC<HeroSectionProps> = ({ onStartExam, siteSettings }) => {\n${fetchLogic}`
);

const downloadButton = `
            {latestApk && (
              <a
                href={latestApk.download_url}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <Download className="w-5 h-5" />
                <span>Download App (v{latestApk.version})</span>
              </a>
            )}
`;

// Looking for a button group
code = code.replace(
  /(<button\s+onClick=\{onStartExam\}[\s\S]*?<\/button>)/,
  `$1\n${downloadButton}`
);

// If we need to import Download
if (!code.includes('Download')) {
  code = code.replace('ArrowLeft,', 'ArrowLeft, Download,');
}

fs.writeFileSync('src/components/HeroSection.tsx', code);
console.log('Patched HeroSection');
