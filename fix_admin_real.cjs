const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

if (!admin.includes('Smartphone,')) {
  admin = admin.replace('import {', 'import {\n  Smartphone,');
}

if (!admin.includes('setAndroidReleases] = useState')) {
  admin = admin.replace(
    'const [questions, setQuestions]',
    'const [androidReleases, setAndroidReleases] = useState<any[]>([]);\n  const [questions, setQuestions]'
  );
}

fs.writeFileSync('src/components/AdminPanel.tsx', admin);
console.log('Fixed AdminPanel reliably');
