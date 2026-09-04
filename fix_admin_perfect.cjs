const fs = require('fs');

let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
admin = admin.replace('import {  Smartphone, resolveApiPath } from "../services/platform";', 'import { resolveApiPath } from "../services/platform";');

fs.writeFileSync('src/components/AdminPanel.tsx', admin);
console.log('Done perfect replace');
