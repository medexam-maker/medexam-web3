const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const bucketName = 'question_images'; \/\/ reusing existing bucket since no new one is guaranteed to exist/g,
  "const bucketName = 'apks';"
);

// wait, is it there twice? let's just replace all instances inside the APK upload block.
code = code.replace(
  "const bucketName = 'question_images';",
  "const bucketName = 'apks';"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts bucketName');
