const fs = require('fs');

// Fix AdminPanel.tsx
let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

if (!admin.includes('setAndroidReleases')) {
  // It shouldn't get here because we just got TS2304 for setAndroidReleases
}
if (!admin.includes('const [androidReleases')) {
  admin = admin.replace(
    "const [importSession, setImportSession]",
    "const [androidReleases, setAndroidReleases] = useState<AndroidRelease[]>([]);\n  const [importSession, setImportSession]"
  );
}

if (!admin.includes('Smartphone,')) {
  admin = admin.replace(
    "UploadCloud,",
    "UploadCloud,\n  Smartphone,"
  );
}
fs.writeFileSync('src/components/AdminPanel.tsx', admin);

// Fix HeroSection.tsx
let hero = fs.readFileSync('src/components/HeroSection.tsx', 'utf8');

if (!hero.includes('latestApk')) {
  // This is weird, I injected it... Wait, I injected it inside HeroSection? Let me check the grep earlier.
}
