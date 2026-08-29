const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add new activeTab states
const oldTabs = "useState<'notifications' | 'questions' | 'bulk_import' | 'councils' | 'ui_settings' | 'proctoring' | 'subs' | 'promo' | 'specialties'>('notifications');";
const newTabs = "useState<'notifications' | 'questions' | 'bulk_import' | 'councils' | 'ui_settings' | 'proctoring' | 'subs' | 'promo' | 'specialties' | 'dashboard' | 'operators' | 'health' | 'integrity' | 'audit' | 'blog'>('dashboard');";
code = code.replace(oldTabs, newTabs);

// Add new states
const stateInjection = `
  const [isAdminOwner, setIsAdminOwner] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [operators, setOperators] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [dataIntegrity, setDataIntegrity] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
`;
code = code.replace(/const \[activeTab, setActiveTab\][^;]+;/, newTabs + "\n" + stateInjection);

// Enhance fetchData to grab the new tabs' data
const fetchDataRegex = /const fetchData = async \(\) => \{\n    setIsRefreshing\(true\);\n    try \{/g;
const newFetchData = `const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const uResp = await fetch('/api/auth/me', { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }});
      if (uResp.ok) {
        const ud = await uResp.json();
        if (ud.user?.isOwnerAdmin) setIsAdminOwner(true);
      }
      
      const metResp = await fetch('/api/admin/metrics', { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }});
      if (metResp.ok) {
        const md = await metResp.json();
        setDashboardMetrics(md.metrics);
      }
      
      const opResp = await fetch('/api/admin/operators', { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }});
      if (opResp.ok) {
        const od = await opResp.json();
        setOperators(od.operators || []);
      }
      
      const blogResp = await fetch('/api/blog');
      if (blogResp.ok) {
        const bd = await blogResp.json();
        setBlogPosts(bd || []);
      }
`;
code = code.replace(fetchDataRegex, newFetchData);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
