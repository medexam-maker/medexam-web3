const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

admin = admin.replace(/import \{\s*resolveApiPath,\s*Smartphone\s*\} from "\.\.\/services\/platform";/g, 'import { resolveApiPath } from "../services/platform";');
admin = admin.replace(/import \{\s*Smartphone,\s*resolveApiPath\s*\} from "\.\.\/services\/platform";/g, 'import { resolveApiPath } from "../services/platform";');

// Let's just blindly remove Smartphone from the platform import if it's there
const lines = admin.split('\n');
let newLines = [];
let inPlatformImport = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import {') && lines[i].includes('../services/platform')) {
         newLines.push(lines[i].replace('Smartphone,', ''));
    } else if (lines[i].includes('} from "../services/platform"')) {
        inPlatformImport = false;
        newLines.push(lines[i]);
    } else {
        newLines.push(lines[i]);
    }
}
admin = newLines.join('\n');
admin = admin.replace(/import\s*\{\s*Smartphone\s*\}\s*from\s*"\.\.\/services\/platform";/, '');
admin = admin.replace(/Smartphone,\s*/g, (match, offset, str) => {
   // Wait this is dangerous. Let's just do a specific string replace
   return match;
});

fs.writeFileSync('src/components/AdminPanel.tsx', admin);
