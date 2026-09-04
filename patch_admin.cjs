const fs = require('fs');

let adminTsx = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Add states for Android Releases
if (!adminTsx.includes('isUploadingRelease')) {
  const stateInjectionPoint = "const [androidReleases, setAndroidReleases] = useState<any[]>([]);";
  const stateLogic = `
  const [androidReleases, setAndroidReleases] = useState<any[]>([]);
  const [isUploadingRelease, setIsUploadingRelease] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ version: '', release_notes: '', is_published: true });
  const [releaseFile, setReleaseFile] = useState<File | null>(null);

  const fetchReleases = async () => {
    try {
      const res = await fetch(resolveApiPath('/api/admin/releases'), {
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.releases) setAndroidReleases(data.releases);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'releases') {
      fetchReleases();
    }
  }, [activeTab]);

  const handleUploadRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseFile || !releaseForm.version) return alert('Version and APK file are required.');
    setIsUploadingRelease(true);
    const formData = new FormData();
    formData.append('apk', releaseFile);
    formData.append('version', releaseForm.version);
    formData.append('release_notes', releaseForm.release_notes);
    formData.append('is_published', releaseForm.is_published.toString());

    try {
      const res = await fetch(resolveApiPath('/api/admin/releases'), {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Release uploaded successfully!');
        setReleaseForm({ version: '', release_notes: '', is_published: true });
        setReleaseFile(null);
        fetchReleases();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setIsUploadingRelease(false);
    }
  };

  const handleTogglePublishRelease = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(resolveApiPath(\`/api/admin/releases/\${id}\`), {
        method: 'PUT',
        headers: { 
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_published: !currentStatus })
      });
      if (res.ok) fetchReleases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRelease = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this release?')) return;
    try {
      const res = await fetch(resolveApiPath(\`/api/admin/releases/\${id}\`), {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }
      });
      if (res.ok) fetchReleases();
    } catch (err) {
      console.error(err);
    }
  };
`;
  adminTsx = adminTsx.replace(stateInjectionPoint, stateLogic);
}

// 2. Add JSX
if (!adminTsx.includes("{activeTab === 'releases' && (")) {
  const jsxInjectionPoint = "{activeTab === 'ui_settings' && (";
  const jsxLogic = `
      {/* ==========================================
          TAB: ANDROID RELEASES
         ========================================== */}
      {activeTab === 'releases' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              إدارة إصدارات تطبيق الأندرويد
            </h3>
            
            <form onSubmit={handleUploadRelease} className="space-y-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الإصدار (Version)</label>
                  <input type="text" value={releaseForm.version} onChange={(e) => setReleaseForm({...releaseForm, version: e.target.value})} placeholder="e.g. 1.0.5" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملف الـ APK</label>
                  <input type="file" accept=".apk" onChange={(e) => setReleaseFile(e.target.files?.[0] || null)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الإصدار (Release Notes)</label>
                <textarea value={releaseForm.release_notes} onChange={(e) => setReleaseForm({...releaseForm, release_notes: e.target.value})} rows={2} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm" placeholder="ما الجديد في هذا الإصدار..."></textarea>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={releaseForm.is_published} onChange={(e) => setReleaseForm({...releaseForm, is_published: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" />
                  نشر التحديث فوراً
                </label>
                <button type="submit" disabled={isUploadingRelease} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {isUploadingRelease ? 'جاري الرفع...' : 'رفع الإصدار'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800">الإصدارات السابقة</h4>
              {androidReleases.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">لا توجد إصدارات مرفوعة بعد.</div>
              ) : (
                androidReleases.map(release => (
                  <div key={release.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-lg text-slate-900">v{release.version}</span>
                        {release.is_published ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">منشور</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">مسودة</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mb-2">{(release.file_size / (1024 * 1024)).toFixed(2)} MB • {new Date(release.created_at).toLocaleDateString()}</div>
                      {release.release_notes && <div className="text-xs text-slate-600">{release.release_notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleTogglePublishRelease(release.id, release.is_published)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors" title={release.is_published ? "إلغاء النشر" : "نشر"}>
                        {release.is_published ? <Eye className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4 opacity-50" />}
                      </button>
                      <button onClick={() => handleDeleteRelease(release.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ui_settings' && (
`;
  adminTsx = adminTsx.replace(jsxInjectionPoint, jsxLogic);
}

fs.writeFileSync('src/components/AdminPanel.tsx', adminTsx);
console.log('Successfully patched AdminPanel.tsx with Android Releases UI');
