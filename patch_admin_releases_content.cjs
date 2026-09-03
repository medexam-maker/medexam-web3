const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const releasesContent = `
       {/* ==========================================
           TAB: ANDROID RELEASES
          ========================================== */}
       {activeTab === 'releases' && (
         <div className="space-y-6">
           <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                   <Smartphone className="w-6 h-6 text-emerald-600" />
                   <span>Android Releases Manager</span>
                 </h3>
                 <p className="text-xs text-slate-500 mt-1">Upload and publish APKs</p>
               </div>
             </div>
             
             {/* Upload Form */}
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
               <h4 className="font-bold text-slate-800 text-sm mb-3">Upload New Release</h4>
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 const formData = new FormData(e.currentTarget);
                 const fileInput = document.getElementById('apk_file');
                 if (!fileInput.files.length) return alert('Please select an APK');
                 
                 const btn = document.getElementById('upload_apk_btn');
                 btn.disabled = true;
                 btn.innerText = 'Uploading...';
                 
                 try {
                   const res = await fetch(resolveApiPath('/api/admin/releases'), {
                     method: 'POST',
                     headers: { 'Authorization': \`Bearer \${localStorage.getItem('medexam_token')}\` },
                     body: formData
                   });
                   const data = await res.json();
                   if (res.ok && data.success) {
                     alert('Release uploaded successfully!');
                     e.target.reset();
                     loadAdminData();
                   } else {
                     alert(data.error || 'Failed to upload release');
                   }
                 } catch (err) {
                   alert('Error: ' + err.message);
                 } finally {
                   btn.disabled = false;
                   btn.innerText = 'Upload Release';
                 }
               }} className="space-y-3">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1">Version (e.g. 1.0.4)</label>
                     <input type="text" name="version" required className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                     <select name="is_published" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs">
                       <option value="false">Draft (Hidden)</option>
                       <option value="true">Published (Live)</option>
                     </select>
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">Release Notes</label>
                   <textarea name="release_notes" rows="2" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"></textarea>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">APK File (.apk)</label>
                   <input type="file" id="apk_file" name="apk" accept=".apk" required className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs" />
                 </div>
                 <button type="submit" id="upload_apk_btn" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors">
                   Upload Release
                 </button>
               </form>
             </div>
             
             {/* Releases List */}
             <div className="overflow-x-auto rounded-xl border border-slate-200">
               <table className="w-full text-right text-xs">
                 <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                   <tr>
                     <th className="p-3">Version</th>
                     <th className="p-3">Status</th>
                     <th className="p-3">Size</th>
                     <th className="p-3">SHA-256</th>
                     <th className="p-3">Date</th>
                     <th className="p-3">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {androidReleases.length === 0 ? (
                     <tr><td colSpan="6" className="p-4 text-center text-slate-500">No releases found</td></tr>
                   ) : (
                     androidReleases.map(rel => (
                       <tr key={rel.id} className="hover:bg-slate-50">
                         <td className="p-3 font-bold text-emerald-800">{rel.version}</td>
                         <td className="p-3">
                           <span className={\`px-2 py-1 rounded-md text-[10px] font-bold \${rel.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}\`}>
                             {rel.is_published ? 'Published' : 'Draft'}
                           </span>
                         </td>
                         <td className="p-3 text-slate-600 font-mono">{(rel.file_size / 1024 / 1024).toFixed(2)} MB</td>
                         <td className="p-3 text-slate-400 font-mono text-[10px] truncate max-w-[100px]" title={rel.sha256}>{rel.sha256}</td>
                         <td className="p-3 text-slate-500 text-[10px]">{new Date(rel.created_at).toLocaleDateString()}</td>
                         <td className="p-3 flex items-center gap-2">
                           <button onClick={async () => {
                             const res = await authFetch(\`/api/admin/releases/\${rel.id}\`, {
                               method: 'PUT',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ is_published: !rel.is_published })
                             });
                             if (res.ok) loadAdminData();
                           }} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold">
                             {rel.is_published ? 'Unpublish' : 'Publish'}
                           </button>
                           <button onClick={async () => {
                             if (!confirm('Are you sure you want to delete this release?')) return;
                             const res = await authFetch(\`/api/admin/releases/\${rel.id}\`, { method: 'DELETE' });
                             if (res.ok) loadAdminData();
                           }} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[10px] font-bold">
                             Delete
                           </button>
                           <a href={rel.download_url} target="_blank" className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">
                             Download
                           </a>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       )}
`;

code = code.replace(
  "{/* ==========================================\n           TAB 0: LIVE NOTIFICATIONS",
  releasesContent + "\n       {/* ==========================================\n           TAB 0: LIVE NOTIFICATIONS"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
console.log('Patched AdminPanel releases content');
