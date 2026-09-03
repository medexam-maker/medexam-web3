const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('UpdateChecker')) {
  code = code.replace(
    "import { isNativeMobileApp } from './services/platform';",
    "import { isNativeMobileApp } from './services/platform';\nimport { UpdateChecker } from './components/UpdateChecker';"
  );
  
  // Just inject before the Router
  code = code.replace(
    '<Router>',
    '<Router>\n      <UpdateChecker />'
  );
  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched App.tsx');
} else {
  console.log('Already patched App.tsx');
}
