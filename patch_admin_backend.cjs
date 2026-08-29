const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add operationalAdminsStore
code = code.replace(
  /let siteSettingsStore: any = \{/,
  "let operationalAdminsStore: Array<{ email: string, status: 'active' | 'disabled', createdAt: number, createdBy: string, disabledAt?: number, disabledBy?: string }> = [];\nlet siteSettingsStore: any = {"
);

code = code.replace(
  /blogPostsStore = await loadSetting\("blogPosts", blogPostsStore\);/,
  "blogPostsStore = await loadSetting(\"blogPosts\", blogPostsStore);\n      operationalAdminsStore = await loadSetting(\"operationalAdmins\", operationalAdminsStore);"
);

// 2. Modify requireAdmin
const requireAdminRegex = /function requireAdmin[\s\S]*?\}\n\}/;
const newRequireAdmin = `function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: "غير مصرح: يلزم تسجيل الدخول كمدير" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    const cleanEmail = String(decoded.email).trim().toLowerCase();
    
    const isOwner = ADMIN_EMAILS.includes(cleanEmail);
    const opAdmin = operationalAdminsStore.find(a => a.email === cleanEmail);
    
    if (!isOwner) {
      if (!opAdmin || opAdmin.status !== 'active') {
        return res.status(403).json({ success: false, error: "غير مصرح: حساب الإدارة غير فعال" });
      }
    }
    
    if (decoded.role !== "admin" && !isOwner && !(opAdmin && opAdmin.status === 'active')) {
      return res.status(403).json({ success: false, error: "هذا الإجراء متاح للمدير فقط" });
    }
    
    (req as any).adminEmail = cleanEmail;
    (req as any).isOwnerAdmin = isOwner;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "جلسة الدخول منتهية أو غير صالحة" });
  }
}`;
code = code.replace(requireAdminRegex, newRequireAdmin);

// 3. Modify Login Logic
const loginAuthBlock = `    if (!isMatch) {
      logSystemEvent('warn', 'auth', \`Failed admin login attempt for \${cleanEmail}\`);
      return res.status(401).json({ success: false, error: "بيانات الدخول غير صحيحة" });
    }

    const token = signToken({ email: cleanEmail, role: "admin" });
    return res.json({
      success: true,
      token,
      user: {
        email: cleanEmail,
        name: 'مدير المنصة',
        role: 'admin',
        isActive: true,
        isSubscribed: true,
        subscriptionStatus: 'active',
        remainingDays: 3650
      }
    });
  }`;

const replacementAuthBlock = `    if (!isMatch) {
      logSystemEvent('warn', 'auth', \`Failed admin login attempt for \${cleanEmail}\`);
      return res.status(401).json({ success: false, error: "بيانات الدخول غير صحيحة" });
    }

    const token = signToken({ email: cleanEmail, role: "admin" });
    return res.json({
      success: true,
      token,
      user: {
        email: cleanEmail,
        name: 'مدير المنصة',
        role: 'admin',
        isActive: true,
        isSubscribed: true,
        subscriptionStatus: 'active',
        remainingDays: 3650,
        isOwnerAdmin: true
      }
    });
  }
  
  const opAdmin = operationalAdminsStore.find(a => a.email === cleanEmail);
  if (opAdmin && opAdmin.status === 'disabled') {
     return res.status(403).json({ success: false, error: "حساب المدير معطل. يرجى مراجعة الإدارة." });
  }`;
  
code = code.replace(loginAuthBlock, replacementAuthBlock);

// 4. Modify normal user login issuing admin token if opAdmin is active
const signTokenUserRegex = /const token = signToken\(\{ email: cleanEmail, role: "user" \}\);/;
const replacementSignTokenUser = `const isAdminRole = (opAdmin && opAdmin.status === 'active');
  const token = signToken({ email: cleanEmail, role: isAdminRole ? "admin" : "user" });`;
code = code.replace(signTokenUserRegex, replacementSignTokenUser);

const userRoleRegex = /role: 'user',/g;
// Replace only the first occurrence after signTokenUserRegex replacement, or we can just replace in the JSON response
const jsonResponseRegex = /role: 'user',\n      isActive: dbUser\.is_active,/;
const replacementJsonResponse = `role: isAdminRole ? 'admin' : 'user',\n      isActive: dbUser.is_active,\n      isOwnerAdmin: false,`;
code = code.replace(jsonResponseRegex, replacementJsonResponse);


// 5. Add /api/admin/ endpoints
const adminEndpoints = `
// P2.0 Admin Management
app.get("/api/admin/operators", requireAdmin, (req, res) => {
  const isOwner = (req as any).isOwnerAdmin;
  if (!isOwner) return res.status(403).json({ error: "Owner Admin access required" });
  res.json({ success: true, operators: operationalAdminsStore, ownerEmails: ADMIN_EMAILS });
});

app.post("/api/admin/operators", requireAdmin, async (req, res) => {
  const isOwner = (req as any).isOwnerAdmin;
  const ownerEmail = (req as any).adminEmail;
  if (!isOwner) return res.status(403).json({ error: "Owner Admin access required" });
  
  const { action, email } = req.body;
  if (!email || !action) return res.status(400).json({ error: "Missing email or action" });
  const cleanEmail = email.trim().toLowerCase();
  
  if (ADMIN_EMAILS.includes(cleanEmail)) {
     return res.status(400).json({ error: "Cannot modify Owner Admin" });
  }

  let existingIdx = operationalAdminsStore.findIndex(a => a.email === cleanEmail);
  
  if (action === 'create') {
    if (existingIdx >= 0) return res.status(400).json({ error: "Operator already exists" });
    operationalAdminsStore.push({ email: cleanEmail, status: 'active', createdAt: Date.now(), createdBy: ownerEmail });
  } else if (action === 'disable') {
    if (existingIdx < 0) return res.status(404).json({ error: "Operator not found" });
    operationalAdminsStore[existingIdx].status = 'disabled';
    operationalAdminsStore[existingIdx].disabledAt = Date.now();
    operationalAdminsStore[existingIdx].disabledBy = ownerEmail;
  } else if (action === 'enable') {
    if (existingIdx < 0) return res.status(404).json({ error: "Operator not found" });
    operationalAdminsStore[existingIdx].status = 'active';
  } else if (action === 'remove') {
    if (existingIdx < 0) return res.status(404).json({ error: "Operator not found" });
    operationalAdminsStore.splice(existingIdx, 1);
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }
  
  await saveSetting("operationalAdmins", operationalAdminsStore);
  res.json({ success: true, operators: operationalAdminsStore });
});

// P2.A Dashboard Metrics
app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
  try {
    const qs = await executeDbQuery("SELECT COUNT(*) as count, status FROM unified_question_bank GROUP BY status");
    let totalQuestions = 0;
    let activeQuestions = 0;
    qs.rows.forEach(r => {
      const c = parseInt(r.count, 10);
      totalQuestions += c;
      if (r.status === 'approved') activeQuestions += c;
    });
    
    const usersRes = await executeDbQuery("SELECT COUNT(*) as count FROM users");
    const totalUsers = parseInt(usersRes.rows[0].count, 10);
    
    const subsRes = await executeDbQuery("SELECT COUNT(*) as count FROM users WHERE is_subscribed = true");
    const activeSubscribers = parseInt(subsRes.rows[0].count, 10);
    
    const attemptsRes = await executeDbQuery("SELECT COUNT(*) as count FROM exam_attempts WHERE status = 'completed'");
    const completedExams = parseInt(attemptsRes.rows[0].count, 10);
    
    res.json({
      success: true,
      metrics: {
        totalQuestions,
        activeQuestions,
        totalUsers,
        activeSubscribers,
        completedExams
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch metrics", details: err.message });
  }
});

// P2.D System Health
app.get("/api/admin/health", requireAdmin, async (req, res) => {
  const health = {
    database: 'UNKNOWN',
    auth: 'UNKNOWN',
    importer: 'UNKNOWN',
    error: null
  };
  try {
    if (dbPool && isDbConnected) {
      const resDb = await executeDbQuery("SELECT 1");
      health.database = resDb ? 'PASS' : 'FAIL';
    } else {
      health.database = 'FAIL';
    }
  } catch (e: any) {
    health.database = 'FAIL';
    health.error = e.message;
  }
  
  health.auth = (JWT_SECRET && JWT_SECRET.length > 5) ? 'PASS' : 'FAIL';
  
  try {
    const qCount = await executeDbQuery("SELECT COUNT(*) as c FROM unified_question_bank");
    health.importer = qCount ? 'PASS' : 'WARNING';
  } catch (e) {
    health.importer = 'FAIL';
  }
  
  res.json({ success: true, health });
});

// P2.E Data Integrity
app.get("/api/admin/integrity", requireAdmin, async (req, res) => {
  try {
    const orphanSpecs = await executeDbQuery(\`
      SELECT uqb.id, uqb.specialty_id 
      FROM unified_question_bank uqb 
      LEFT JOIN medical_specialties ms ON uqb.specialty_id = ms.id 
      WHERE ms.id IS NULL
    \`);
    
    const orphanCats = await executeDbQuery(\`
      SELECT uqb.id, uqb.category_id 
      FROM unified_question_bank uqb 
      LEFT JOIN specialty_categories sc ON uqb.category_id = sc.id 
      WHERE uqb.category_id IS NOT NULL AND sc.id IS NULL
    \`);
    
    res.json({
      success: true,
      diagnostics: {
        orphanSpecialties: orphanSpecs.rows.length,
        orphanCategories: orphanCats.rows.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed integrity check", details: err.message });
  }
});

// P2.F Audit Logs (Read-only aggregation)
app.get("/api/admin/audit", requireAdmin, async (req, res) => {
  try {
    const history = [];
    const subs = await executeDbQuery("SELECT id, user_email, status, created_at FROM subscription_requests ORDER BY created_at DESC LIMIT 20");
    subs.rows.forEach(r => history.push({ type: 'subscription', id: r.id, user: r.user_email, status: r.status, timestamp: r.created_at }));
    
    const imports = await executeDbQuery("SELECT id, uploaded_by, status, created_at FROM import_sessions ORDER BY created_at DESC LIMIT 20");
    imports.rows.forEach(r => history.push({ type: 'import', id: r.id, user: r.uploaded_by, status: r.status, timestamp: r.created_at }));
    
    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({ success: true, audit: history.slice(0, 50) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch audit logs", details: err.message });
  }
});
`;

code = code.replace("// SEO Endpoints: robots.txt & sitemap.xml", adminEndpoints + "\n// SEO Endpoints: robots.txt & sitemap.xml");

fs.writeFileSync('server.ts', code);
