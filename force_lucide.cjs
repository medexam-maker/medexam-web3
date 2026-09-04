const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const lucideMatch = admin.match(/import\s*\{([^}]*)\}\s*from\s*'lucide-react';/);
if (lucideMatch) {
    let imports = lucideMatch[1].split(',').map(s => s.trim()).filter(s => s);
    if (!imports.includes('Smartphone')) {
        imports.push('Smartphone');
        let uniqueImports = [...new Set(imports)];
        admin = admin.replace(lucideMatch[0], `import { ${uniqueImports.join(', ')} } from 'lucide-react';`);
        fs.writeFileSync('src/components/AdminPanel.tsx', admin);
        console.log('Successfully injected Smartphone into lucide-react in AdminPanel');
    }
} else {
    console.log('No lucide-react import found in AdminPanel');
}
