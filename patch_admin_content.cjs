const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const injection = `
      {/* P2.A Dashboard */}
      {activeTab === 'dashboard' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold">اللوحة الرئيسية (P2.A)</h2>
           {dashboardMetrics ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">إجمالي الأسئلة</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.totalQuestions}</p>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">أسئلة معتمدة</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.activeQuestions}</p>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">المستخدمين / المشتركين</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.activeSubscribers} <span className="text-sm text-slate-400">/ {dashboardMetrics.totalUsers}</span></p>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">الامتحانات المكتملة</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.completedExams}</p>
               </div>
             </div>
           ) : (
             <p className="text-slate-500">جاري تحميل الإحصائيات...</p>
           )}
         </div>
      )}

      {/* P2.D Health */}
      {activeTab === 'health' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600"/> فحص صحة النظام (P2.D)</h2>
           <button onClick={async () => {
             const res = await fetch('/api/admin/health', { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }});
             if (res.ok) {
               const d = await res.json();
               setSystemHealth(d.health);
             }
           }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">إجراء فحص الآن</button>
           
           {systemHealth && (
             <div className="grid gap-4 mt-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-slate-700">اتصال قاعدة البيانات PostgreSQL</span>
                 <span className={\`font-black text-sm px-3 py-1 rounded-md \${systemHealth.database === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>{systemHealth.database}</span>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-slate-700">مفتاح المصادقة (JWT)</span>
                 <span className={\`font-black text-sm px-3 py-1 rounded-md \${systemHealth.auth === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>{systemHealth.auth}</span>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-slate-700">جاهزية بنك الأسئلة والمستورد</span>
                 <span className={\`font-black text-sm px-3 py-1 rounded-md \${systemHealth.importer === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}\`}>{systemHealth.importer}</span>
               </div>
             </div>
           )}
         </div>
      )}

      {/* P2.E Integrity */}
      {activeTab === 'integrity' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600"/> سلامة البيانات (P2.E)</h2>
           <button onClick={async () => {
             const res = await fetch('/api/admin/integrity', { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }});
             if (res.ok) {
               const d = await res.json();
               setDataIntegrity(d.diagnostics);
             }
           }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">فحص سلامة البيانات الآن</button>
           
           {dataIntegrity && (
             <div className="grid gap-4 mt-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                 <span className="font-bold text-slate-700">تخصصات غير موجودة (يتامى)</span>
                 <span className={\`font-black text-sm px-3 py-1 rounded-md \${dataIntegrity.orphanSpecialties > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`}>{dataIntegrity.orphanSpecialties} أسئلة متعارضة</span>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                 <span className="font-bold text-slate-700">أقسام غير موجودة (يتامى)</span>
                 <span className={\`font-black text-sm px-3 py-1 rounded-md \${dataIntegrity.orphanCategories > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`}>{dataIntegrity.orphanCategories} أسئلة متعارضة</span>
               </div>
             </div>
           )}
         </div>
      )}
      
      {/* P2.F Audit */}
      {activeTab === 'audit' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-slate-700"/> سجل النشاط والإجراءات (P2.F)</h2>
           <button onClick={async () => {
             const res = await fetch('/api/admin/audit', { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` }});
             if (res.ok) {
               const d = await res.json();
               setAuditLogs(d.audit);
             }
           }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">تحديث السجل</button>
           
           <div className="space-y-2 mt-4">
             {auditLogs.map((log, i) => (
               <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm">
                 <div>
                   <span className={\`font-bold mr-2 \${log.type === 'subscription' ? 'text-indigo-600' : 'text-emerald-600'}\`}>{log.type === 'subscription' ? 'مراجعة اشتراك' : 'جلسة استيراد'}</span>
                   <span className="text-slate-700">{log.user}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{log.status}</span>
                   <span className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                 </div>
               </div>
             ))}
             {auditLogs.length === 0 && <p className="text-slate-500 py-4 text-center">لا توجد سجلات بعد. اضغط "تحديث السجل".</p>}
           </div>
         </div>
      )}
      
      {/* P2.0 Operators */}
      {activeTab === 'operators' && isAdminOwner && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600"/> إدارة المدراء التشغيليين (P2.0)</h2>
           
           <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
             <h3 className="font-bold text-emerald-900 mb-4">إضافة مدير تشغيلي جديد</h3>
             <div className="flex flex-col sm:flex-row gap-3">
               <input type="email" id="newOpEmail" placeholder="البريد الإلكتروني للمدير..." className="border border-emerald-200 rounded-xl p-3 flex-1 bg-white" />
               <button onClick={async () => {
                 const em = (document.getElementById('newOpEmail') as HTMLInputElement).value;
                 const res = await fetch('/api/admin/operators', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
                   body: JSON.stringify({ action: 'create', email: em })
                 });
                 if (res.ok) {
                   const d = await res.json();
                   setOperators(d.operators);
                   (document.getElementById('newOpEmail') as HTMLInputElement).value = '';
                 } else {
                   alert((await res.json()).error);
                 }
               }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm">منح الصلاحية</button>
             </div>
           </div>
           
           <div className="space-y-3 mt-6">
             {operators.map((op, i) => (
               <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-sm shadow-xs">
                 <div>
                   <p className="font-black text-slate-800 text-base">{op.email}</p>
                   <p className="text-xs text-slate-500 mt-1">أضيف بواسطة: {op.createdBy} | {new Date(op.createdAt).toLocaleDateString('ar-EG')}</p>
                 </div>
                 <div className="flex flex-wrap items-center gap-2">
                   <span className={\`px-3 py-1.5 rounded-lg text-[11px] font-black \${op.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>
                     {op.status === 'active' ? 'حساب نشط' : 'معطل'}
                   </span>
                   {op.status === 'active' ? (
                     <button onClick={async () => {
                       const res = await fetch('/api/admin/operators', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
                         body: JSON.stringify({ action: 'disable', email: op.email })
                       });
                       if (res.ok) setOperators((await res.json()).operators);
                     }} className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold rounded-lg transition-colors">تعطيل الدخول</button>
                   ) : (
                     <button onClick={async () => {
                       const res = await fetch('/api/admin/operators', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
                         body: JSON.stringify({ action: 'enable', email: op.email })
                       });
                       if (res.ok) setOperators((await res.json()).operators);
                     }} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg transition-colors">تفعيل</button>
                   )}
                   <button onClick={async () => {
                     const res = await fetch('/api/admin/operators', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
                       body: JSON.stringify({ action: 'remove', email: op.email })
                     });
                     if (res.ok) setOperators((await res.json()).operators);
                   }} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg transition-colors">حذف نهائي</button>
                 </div>
               </div>
             ))}
             {operators.length === 0 && (
               <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
                 <p className="text-slate-500 font-bold">لا يوجد مدراء تشغيليين حالياً.</p>
                 <p className="text-slate-400 text-xs mt-1">قم بإضافة بريد إلكتروني لمنح صلاحيات الإدارة.</p>
               </div>
             )}
           </div>
         </div>
      )}

      {/* P2.C Blog */}
      {activeTab === 'blog' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600"/> إدارة المدونة والمحتوى (P2.C)</h2>
           <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
             تم دمج واجهة المحتوى مع المستودع الحالي. المقالات معروضة بناءً على <code className="text-xs bg-slate-200 px-1 rounded text-slate-800">app_settings / blogPostsStore</code>.
           </p>
           
           <div className="grid gap-4 md:grid-cols-2">
             {blogPosts.map(post => (
               <div key={post.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                 <div>
                   <h3 className="font-black text-slate-900 text-lg mb-2">{post.title}</h3>
                   <p className="text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
                 </div>
                 <div className="flex flex-wrap gap-3 mt-4 text-[11px] font-bold text-slate-500 border-t border-slate-100 pt-3">
                   <span className="bg-slate-100 px-2 py-1 rounded-md">تاريخ: {post.date}</span>
                   <span className="bg-slate-100 px-2 py-1 rounded-md">التصنيف: {post.category}</span>
                   <span className="bg-slate-100 px-2 py-1 rounded-md">المشاهدات: {post.viewsCount || 0}</span>
                 </div>
               </div>
             ))}
             {blogPosts.length === 0 && <p className="text-slate-500 py-6 text-center md:col-span-2">لا يوجد مقالات منشورة حالياً.</p>}
           </div>
         </div>
      )}
      
      {/* Receipt Image Zoom Modal */}`;

code = code.replace("{/* Receipt Image Zoom Modal */}", injection);
fs.writeFileSync('src/components/AdminPanel.tsx', code);
