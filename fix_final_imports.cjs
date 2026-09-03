const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
admin = admin.replace('import {\n  Smartphone,\n  resolveApiPath', 'import {\n  resolveApiPath');
if (!admin.includes('Smartphone,')) {
  admin = admin.replace('UploadCloud,', 'UploadCloud,\n  Smartphone,');
}
fs.writeFileSync('src/components/AdminPanel.tsx', admin);

let hero = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');
// It added import { Download, resolveApiPath... wait.
// Let's just use regex to fix it.
hero = hero.replace(/import \{\s*Download,\s*useNavigate/g, 'import { useNavigate');
hero = hero.replace(/import \{\s*Download,\s*resolveApiPath/g, 'import { resolveApiPath');

if (!hero.includes('Download,')) {
  hero = hero.replace('Search', 'Search,\n  Download');
}

fs.writeFileSync('src/components/HeroSection.tsx', hero);
console.log('Fixed imports again');
