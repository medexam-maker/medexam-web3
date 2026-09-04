const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// The Lucide-react import block starts around line 6
// Let's just find "UploadCloud," and append "Smartphone," directly
if (!admin.match(/UploadCloud,\s*Smartphone,/)) {
    admin = admin.replace('UploadCloud,', 'UploadCloud,\n  Smartphone,');
}

fs.writeFileSync('src/components/AdminPanel.tsx', admin);
console.log('Fixed final admin import');
