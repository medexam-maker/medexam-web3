const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
admin = admin.replace('import {\n  resolveApiPath,\n  Smartphone\n} from "../services/platform";', 'import { resolveApiPath } from "../services/platform";');
admin = admin.replace('import {\n  resolveApiPath,\nSmartphone\n} from "../services/platform";', 'import { resolveApiPath } from "../services/platform";');
admin = admin.replace(/import\s*\{\s*resolveApiPath,\s*Smartphone\s*\}\s*from\s*"\.\.\/services\/platform";/g, 'import { resolveApiPath } from "../services/platform";');
// make sure Smartphone is in lucide-react
if (!admin.includes('Smartphone,')) {
    admin = admin.replace('UploadCloud,', 'UploadCloud,\n  Smartphone,');
}
fs.writeFileSync('src/components/AdminPanel.tsx', admin);

let hero = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');
// Deduplicate 'Download' import in HeroSection.tsx
hero = hero.replace(/Download,\s*Download/g, 'Download');
hero = hero.replace(/import\s*\{\s*Download\s*\}\s*from\s*"react-router-dom";/g, ''); // maybe it was imported from react-router-dom?
hero = hero.replace(/Download,\s*Search/g, 'Download,\nSearch');

const lucideMatch = hero.match(/import\s*\{([^}]*)\}\s*from\s*'lucide-react';/);
if (lucideMatch) {
    let imports = lucideMatch[1].split(',').map(s => s.trim()).filter(s => s);
    let uniqueImports = [...new Set(imports)];
    hero = hero.replace(lucideMatch[0], `import { ${uniqueImports.join(', ')} } from 'lucide-react';`);
}
fs.writeFileSync('src/components/HeroSection.tsx', hero);

console.log('Fixed compile errors');
