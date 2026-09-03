const fs = require('fs');

// Hero
let hero = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');
if (!hero.includes('const [latestApk')) {
  hero = hero.replace(
    /export const HeroSection: React\.FC<HeroSectionProps> = \(\{([\s\S]*?)\}\) => \{/,
    `import { resolveApiPath } from '../services/platform';\nexport const HeroSection: React.FC<HeroSectionProps> = ({\n$1\n}) => {\n  const [latestApk, setLatestApk] = useState<any>(null);\n  \n  useEffect(() => {\n    fetch(resolveApiPath('/api/app/latest'))\n      .then(res => res.json())\n      .then(data => {\n        if (data.success && data.release) {\n          setLatestApk(data.release);\n        }\n      })\n      .catch(err => console.error('Error fetching latest APK:', err));\n  }, []);\n`
  );
  if (!hero.includes('Download')) {
    hero = hero.replace('Search\n}', 'Search,\n  Download\n}');
  }
  fs.writeFileSync('src/components/HeroSection.tsx', hero);
}

// AdminPanel
let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
if (!admin.includes('const [androidReleases')) {
  admin = admin.replace(
    'const [importSession, setImportSession] = useState',
    'const [androidReleases, setAndroidReleases] = useState<any[]>([]);\n  const [importSession, setImportSession] = useState'
  );
  if (!admin.includes('Smartphone,')) {
    admin = admin.replace('UploadCloud,', 'UploadCloud,\n  Smartphone,');
  }
  fs.writeFileSync('src/components/AdminPanel.tsx', admin);
}
console.log('Fixed ALL properly');
