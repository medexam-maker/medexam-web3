const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
if (!admin.includes('Smartphone,')) {
    admin = admin.replace('UploadCloud,', 'UploadCloud,\n  Smartphone,');
}
fs.writeFileSync('src/components/AdminPanel.tsx', admin);
console.log('Fixed Smartphone import');
