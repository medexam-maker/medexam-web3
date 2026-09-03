const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = "import { UpdateChecker } from './components/UpdateChecker';\n" + code;
code = code.replace('<Router>', '<Router>\n      <UpdateChecker />');

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx properly');
