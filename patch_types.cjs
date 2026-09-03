const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('AndroidRelease')) {
  code += `\nexport interface AndroidRelease {\n  id: string;\n  version: string;\n  download_url: string;\n  sha256: string;\n  file_size: number;\n  release_notes: string;\n  is_published: boolean;\n  created_at: string;\n}\n`;
  fs.writeFileSync('src/types.ts', code);
  console.log('Added AndroidRelease to types.ts');
} else {
  console.log('Already patched');
}
