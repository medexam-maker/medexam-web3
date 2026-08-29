const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const badCode = "useState<'notifications' | 'questions' | 'bulk_import' | 'councils' | 'ui_settings' | 'proctoring' | 'subs' | 'promo' | 'specialties' | 'dashboard' | 'operators' | 'health' | 'integrity' | 'audit' | 'blog'>('dashboard');";
const goodCode = "const [activeTab, setActiveTab] = " + badCode;
code = code.replace(badCode, goodCode);

// Also fix duplicate icons
code = code.replace(", BarChart, Users, Activity, Database, FileText } from 'lucide-react';", ", BarChart, Activity, Database } from 'lucide-react';");

fs.writeFileSync('src/components/AdminPanel.tsx', code);
