const fs = require('fs');
let code = fs.readFileSync('src/components/UpdateChecker.tsx', 'utf8');

const badBlock = `    if (!isNativeMobileApp()) {
      if (isManual && onCheckComplete) onCheckComplete("Update check is only available in the Android app.");
      else if (isManual) alert("Update check is only available in the Android app.");
      return;
    }
      if (isManual && onCheckComplete) onCheckComplete('Update check is only available in the Android app.');
      return;
    }`;

const goodBlock = `    if (!isNativeMobileApp()) {
      if (isManual && onCheckComplete) onCheckComplete("Update check is only available in the Android app.");
      else if (isManual) alert("Update check is only available in the Android app.");
      return;
    }`;

code = code.replace(badBlock, goodBlock);

fs.writeFileSync('src/components/UpdateChecker.tsx', code);
console.log('Fixed UpdateChecker.tsx');
