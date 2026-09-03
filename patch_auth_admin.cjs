const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/authenticateAdmin/g, 'requireAdmin');

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts with requireAdmin');
