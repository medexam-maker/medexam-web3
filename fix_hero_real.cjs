const fs = require('fs');

let hero = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');
if (!hero.includes('Download,')) {
  hero = hero.replace('import {', 'import {\n  Download,');
  fs.writeFileSync('src/components/HeroSection.tsx', hero);
  console.log('Fixed HeroSection Download import');
}
