const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /} from 'lucide-react';/,
  ", BarChart, Users, Activity, Database, FileText } from 'lucide-react';"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
