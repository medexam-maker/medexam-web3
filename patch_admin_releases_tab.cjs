const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Insert tab button
const tabButton = `
         <button
           onClick={() => setActiveTab('releases')}
           className={\`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 \${
             activeTab === 'releases' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
           }\`}
         >
           <Smartphone className="w-4 h-4 text-emerald-600" />
           <span>Android Releases</span>
         </button>
`;

code = code.replace(
  /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('ui_settings'\)\}[\s\S]*?<\/button>/,
  `$&` + tabButton
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Patched AdminPanel tabs');
