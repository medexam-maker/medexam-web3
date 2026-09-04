const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes('<UpdateChecker />')) {
  app = app.replace(
    '{/* 1. Top Council Notice Marquee Ticker (Hidden during exam mode) */}',
    '<UpdateChecker />\n      {/* 1. Top Council Notice Marquee Ticker (Hidden during exam mode) */}'
  );
  fs.writeFileSync('src/App.tsx', app);
  console.log('Mounted UpdateChecker in App.tsx');
}
