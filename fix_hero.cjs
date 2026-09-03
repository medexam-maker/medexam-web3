const fs = require('fs');
let code = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');

const fetchLogic = `
  const [latestApk, setLatestApk] = useState<any>(null);
  
  useEffect(() => {
    fetch(resolveApiPath('/api/app/latest'))
      .then(res => res.json())
      .then(data => {
        if (data.success && data.release) {
          setLatestApk(data.release);
        }
      })
      .catch(err => console.error('Error fetching latest APK:', err));
  }, []);
`;

if (!code.includes('const [latestApk')) {
  code = code.replace(
    'export const HeroSection: React.FC<HeroSectionProps> = ({ onStartExam, siteSettings }) => {',
    `import { resolveApiPath } from '../services/platform';\nexport const HeroSection: React.FC<HeroSectionProps> = ({ onStartExam, siteSettings }) => {\n${fetchLogic}`
  );
}

if (!code.includes('useEffect')) {
  code = code.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';"
  );
}

fs.writeFileSync('src/components/HeroSection.tsx', code);
console.log('Fixed HeroSection.tsx');
