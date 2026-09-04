const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
`      const res = await fetch(resolveApiPath('/api/admin/releases'), {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
        body: formData
      });`,
`      const res = await authFetch('/api/admin/releases', {
        method: 'POST',
        body: formData
      });`
);

content = content.replace(
`      const res = await fetch(resolveApiPath(\`/api/admin/releases/\${id}\`), {
        method: 'PUT',
        headers: { 
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_published: !currentStatus })
      });`,
`      const res = await authFetch(\`/api/admin/releases/\${id}\`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_published: !currentStatus })
      });`
);

content = content.replace(
`      const res = await fetch(resolveApiPath(\`/api/admin/releases/\${id}\`), {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }
      });`,
`      const res = await authFetch(\`/api/admin/releases/\${id}\`, {
        method: 'DELETE'
      });`
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log("AdminPanel.tsx updated.");
