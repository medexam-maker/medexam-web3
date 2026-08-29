const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const tabBlockStart = '<div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-2 mb-8 text-xs font-bold overflow-x-auto">';

const newTabsUI = `
        <button
          onClick={() => setActiveTab('dashboard')}
          className={\`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 \${
            activeTab === 'dashboard' ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }\`}
        >
          <BarChart className="w-4 h-4" />
          <span>اللوحة (P2.A)</span>
        </button>
        {isAdminOwner && (
          <button
            onClick={() => setActiveTab('operators')}
            className={\`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 \${
              activeTab === 'operators' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <Users className="w-4 h-4" />
            <span>المدراء (P2.0)</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('health')}
          className={\`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 \${
            activeTab === 'health' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }\`}
        >
          <Activity className="w-4 h-4" />
          <span>الصحة (P2.D)</span>
        </button>
        <button
          onClick={() => setActiveTab('integrity')}
          className={\`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 \${
            activeTab === 'integrity' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }\`}
        >
          <Database className="w-4 h-4" />
          <span>البيانات (P2.E)</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={\`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 \${
            activeTab === 'audit' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }\`}
        >
          <Clock className="w-4 h-4" />
          <span>السجل (P2.F)</span>
        </button>
        <button
          onClick={() => setActiveTab('blog')}
          className={\`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 \${
            activeTab === 'blog' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }\`}
        >
          <FileText className="w-4 h-4" />
          <span>المدونة (P2.C)</span>
        </button>
`;

code = code.replace(tabBlockStart, tabBlockStart + "\n" + newTabsUI);
fs.writeFileSync('src/components/AdminPanel.tsx', code);
