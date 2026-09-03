const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
if (!admin.includes('Smartphone,')) {
  admin = admin.replace('UploadCloud,', 'UploadCloud,\n  Smartphone,');
}
if (!admin.includes('setAndroidReleases] = useState')) {
  admin = admin.replace(
    'const [importSession, setImportSession]',
    'const [androidReleases, setAndroidReleases] = useState<any[]>([]);\n  const [importSession, setImportSession]'
  );
}
fs.writeFileSync('src/components/AdminPanel.tsx', admin);

let hero = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');
if (!hero.includes('Download,')) {
  hero = hero.replace('Search\n}', 'Search,\n  Download\n}');
}
fs.writeFileSync('src/components/HeroSection.tsx', hero);

console.log('Fixed lint2');
