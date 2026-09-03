const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const updateBtnMobile = `
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    // Emit a custom event or you can just add UpdateChecker with manualCheck globally
                    window.dispatchEvent(new CustomEvent('TRIGGER_UPDATE_CHECK'));
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-2xs"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Check for Updates</span>
                </button>
              </div>
`;

code = code.replace(
  "{/* Login Callout in Drawer */}",
  "{/* Update Check Callout */}\n" + updateBtnMobile + "\n              {/* Login Callout in Drawer */}"
);

if (!code.includes('Download,')) {
  code = code.replace('LogOut,', 'LogOut,\n  Download,');
}

fs.writeFileSync('src/components/Header.tsx', code);
console.log('Patched Header.tsx');
