const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');

// Find the section for app.post('/api/upload-image'
const uploadImageIdx = serverTs.indexOf("app.post('/api/upload-image'");
const nextPostIdx = serverTs.indexOf("app.post(", uploadImageIdx + 10);
let uploadImageBlock = serverTs.substring(uploadImageIdx, nextPostIdx !== -1 ? nextPostIdx : undefined);

// Replace bucketName = 'apks' with bucketName = 'question_images' inside this block
uploadImageBlock = uploadImageBlock.replace("const bucketName = 'apks';", "const bucketName = 'question_images';");

// Re-integrate
serverTs = serverTs.substring(0, uploadImageIdx) + uploadImageBlock + (nextPostIdx !== -1 ? serverTs.substring(nextPostIdx) : '');

fs.writeFileSync('server.ts', serverTs);
console.log('Fixed /api/upload-image bucket name');
