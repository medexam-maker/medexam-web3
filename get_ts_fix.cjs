const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const lines = code.split('\n');
for(let i = 0; i < 20; i++) console.log(lines[i]);
