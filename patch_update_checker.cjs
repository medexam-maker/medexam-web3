const fs = require('fs');
let code = fs.readFileSync('src/components/UpdateChecker.tsx', 'utf8');

const eventListener = `
  useEffect(() => {
    const handleTrigger = () => checkForUpdates(true);
    window.addEventListener('TRIGGER_UPDATE_CHECK', handleTrigger);
    return () => window.removeEventListener('TRIGGER_UPDATE_CHECK', handleTrigger);
  }, []);
`;

code = code.replace(
  'const [checking, setChecking] = useState(false);',
  'const [checking, setChecking] = useState(false);\n' + eventListener
);

code = code.replace(
  'const checkForUpdates = async () => {',
  'const checkForUpdates = async (isManual = manualCheck) => {'
);

code = code.replace(
  'if (!isNativeMobileApp()) {',
  'if (!isNativeMobileApp()) {\n      if (isManual && onCheckComplete) onCheckComplete("Update check is only available in the Android app.");\n      else if (isManual) alert("Update check is only available in the Android app.");\n      return;\n    }'
);

code = code.replace(
  /if \(manualCheck && onCheckComplete\)/g,
  'if (isManual && onCheckComplete)'
);

// We need an alert if there is no onCheckComplete
code = code.replace(
  'if (isManual && onCheckComplete) onCheckComplete(\'New update available!\');',
  'if (isManual && onCheckComplete) onCheckComplete(\'New update available!\');\n          else if (isManual) alert("New update available!");'
);
code = code.replace(
  'if (isManual && onCheckComplete) onCheckComplete(\'You are on the latest version.\');',
  'if (isManual && onCheckComplete) onCheckComplete(\'You are on the latest version.\');\n          else if (isManual) alert("You are on the latest version.");'
);
code = code.replace(
  'if (isManual && onCheckComplete) onCheckComplete(\'Failed to fetch latest version info.\');',
  'if (isManual && onCheckComplete) onCheckComplete(\'Failed to fetch latest version info.\');\n          else if (isManual) alert("Failed to fetch latest version info.");'
);
code = code.replace(
  'if (isManual && onCheckComplete) onCheckComplete(\'Error checking for updates.\');',
  'if (isManual && onCheckComplete) onCheckComplete(\'Error checking for updates.\');\n      else if (isManual) alert("Error checking for updates.");'
);

fs.writeFileSync('src/components/UpdateChecker.tsx', code);
console.log('Patched UpdateChecker.tsx');
