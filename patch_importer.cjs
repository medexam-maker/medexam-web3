const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

const search = `interface StagedQuestion {
  specialty_id: string;
  category_name?: string;
  category?: string;
  lead_in_ar?: string;
  lead_in_en?: string;
  stem?: string;
  options: any[];
  correct_option_index: number;
  reference_source?: string;
  [key: string]: any;
}

interface StagedImportSession {
  questions: StagedQuestion[];
  createdAt: number;
}`;

const replace = `interface StagedQuestion {
  id: string;
  specialty_id: string;
  category_name?: string;
  category?: string;
  lead_in_ar?: string;
  lead_in_en: string;
  explanation_en: string;
  stem?: string;
  options: any[];
  correct_option_index: number;
  reference_source?: string;
  fingerprint_hash: string;
  [key: string]: any;
}

interface StagedImportSession {
  questions: StagedQuestion[];
  createdAt: number;
  rejectedCount: number;
}`;

serverCode = serverCode.replace(search, replace);

const search2 = `app.post("/api/import/chunk", requireAdmin, async (req, res) => {
  cleanupImportSessions();
  const { sessionId, chunkIndex, data } = req.body;
  if (!sessionId || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  let session = importSessions.get(sessionId);
  if (!session) {
    session = { questions: [], createdAt: Date.now() };
    importSessions.set(sessionId, session);
  }

  const accepted = [];
  const rejected = [];
  
  let existingQuestions: any[] = [];
  try {
    const currentDbQRes = await executeDbQuery("SELECT specialty_id, category_name, lead_in_ar, lead_in_en FROM unified_question_bank");
    existingQuestions = currentDbQRes?.rows || [];
  } catch(e) {
    console.error("Failed to load existing questions for deduplication", e);
  }

  for (let i = 0; i < data.length; i++) {
    const q = data[i];
    const category = q.category || q.category_name;
    const stem = q.stem || q.lead_in_ar || q.lead_in_en;
    if (!q.specialty_id || !category || !stem || !Array.isArray(q.options) || q.correct_option_index == null || typeof q.correct_option_index !== 'number' || q.reference_source === undefined) {
      rejected.push({ index: i, reason: "Missing required fields (specialty_id, category, stem/lead_in, options, correct_option_index, reference_source)" });
      continue;
    }

    const normalizedStem = stem.toString().trim().toLowerCase().replace(/\\s+/g, ' ');
    const isDbDup = existingQuestions.some(dbq => 
      dbq.specialty_id === q.specialty_id && 
      ( (dbq.lead_in_ar && dbq.lead_in_ar.trim().toLowerCase().replace(/\\s+/g, ' ') === normalizedStem) || 
        (dbq.lead_in_en && dbq.lead_in_en.trim().toLowerCase().replace(/\\s+/g, ' ') === normalizedStem) )
    );
    if (isDbDup) {
      rejected.push({ index: i, reason: "Duplicate in database" });
      continue;
    }

    const isSessionDup = session.questions.some(sq => {
      const sqStem = sq.stem || sq.lead_in_ar || sq.lead_in_en || '';
      return sq.specialty_id === q.specialty_id && 
             (sqStem.toString().trim().toLowerCase().replace(/\\s+/g, ' ') === normalizedStem);
    });
    if (isSessionDup) {
      rejected.push({ index: i, reason: "Duplicate in current session" });
      continue;
    }

    session.questions.push(q);
    accepted.push(q);
  }
  
  return res.json({ success: true, chunkIndex, accepted: accepted.length, rejected });
});`;

const replace2 = `app.post("/api/import/chunk", requireAdmin, async (req, res) => {
  cleanupImportSessions();
  const { sessionId, chunkIndex, data } = req.body;
  if (!sessionId || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  let session = importSessions.get(sessionId);
  if (!session) {
    session = { questions: [], createdAt: Date.now(), rejectedCount: 0 };
    importSessions.set(sessionId, session);
  }

  const accepted = [];
  const rejected = [];
  
  let existingFingerprints: Set<string> = new Set();
  try {
    const currentDbQRes = await executeDbQuery("SELECT fingerprint_hash FROM unified_question_bank WHERE fingerprint_hash IS NOT NULL");
    if (currentDbQRes && currentDbQRes.rows) {
      currentDbQRes.rows.forEach((row: any) => existingFingerprints.add(row.fingerprint_hash));
    }
  } catch(e) {
    console.error("Failed to load existing fingerprints for deduplication", e);
  }

  for (let i = 0; i < data.length; i++) {
    const q = data[i];
    
    // Mandatory fields check: specialty_id, lead_in_en, options array, correct_option_index, explanation_en
    if (!q.specialty_id || !q.lead_in_en || !Array.isArray(q.options) || q.correct_option_index == null || typeof q.correct_option_index !== 'number' || !q.explanation_en) {
      rejected.push({ index: i, reason: "Missing required fields (specialty_id, lead_in_en, options, correct_option_index, explanation_en)" });
      continue;
    }

    const fingerprintStr = \`\${q.specialty_id}|\${q.lead_in_en.trim().toLowerCase()}\`;
    const fingerprint_hash = crypto.createHash('sha256').update(fingerprintStr).digest('hex');

    if (existingFingerprints.has(fingerprint_hash)) {
      rejected.push({ index: i, reason: "Duplicate in database (fingerprint collision)" });
      continue;
    }

    const isSessionDup = session.questions.some((sq: any) => sq.fingerprint_hash === fingerprint_hash);
    if (isSessionDup) {
      rejected.push({ index: i, reason: "Duplicate in current session (fingerprint collision)" });
      continue;
    }

    const qId = crypto.randomUUID();
    const stagedQ = { ...q, id: qId, fingerprint_hash };
    session.questions.push(stagedQ);
    accepted.push(stagedQ);
  }
  
  session.rejectedCount += rejected.length;
  return res.json({ success: true, chunkIndex, accepted: accepted.length, rejected });
});`;

serverCode = serverCode.replace(search2, replace2);

const search3 = `app.get("/api/import/preview/:sessionId", requireAdmin, async (req, res) => {
  cleanupImportSessions();
  const session = importSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found or expired" });
  }
  return res.json({
    status: "ready",
    previewCount: session.questions.length,
    sampleQuestions: session.questions.slice(0, 5),
    rejectedCount: 0 
  });
});

app.post("/api/import/commit", requireAdmin, async (req, res) => {
  cleanupImportSessions();
  const { sessionId, confirm } = req.body;
  if (!confirm) {
    return res.status(400).json({ error: "Confirmation required" });
  }
  const session = importSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found or expired" });
  }
  if (!dbPool) {
    return res.status(503).json({ error: "Database not connected" });
  }

  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    for (const q of session.questions) {
      let attempts = 0;
      let success = false;
      while (attempts < 2 && !success) {
        try {
          const category = q.category || q.category_name;
          const leadInAr = q.lead_in_ar || q.stem || '';
          const leadInEn = q.lead_in_en || '';
          await client.query(
            "INSERT INTO unified_question_bank (specialty_id, category_name, lead_in_ar, lead_in_en, options, correct_option_index, reference_source) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [q.specialty_id, category, leadInAr, leadInEn, JSON.stringify(q.options), q.correct_option_index, q.reference_source || '']
          );
          success = true;
        } catch (e) {
          attempts++;
          if (attempts >= 2) throw e;
        }
      }
    }
    await client.query("COMMIT");
    importSessions.delete(sessionId);
    return res.json({ success: true, inserted: session.questions.length });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Database commit failed", details: err.message });
  } finally {
    client.release();
  }
});`;

const replace3 = `app.get("/api/import/preview/:sessionId", requireAdmin, async (req, res) => {
  cleanupImportSessions();
  const session = importSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found or expired" });
  }
  return res.json({
    status: "ready",
    previewCount: session.questions.length,
    sampleQuestions: session.questions.slice(0, 5),
    rejectedCount: session.rejectedCount 
  });
});

app.post("/api/import/commit", requireAdmin, async (req, res) => {
  cleanupImportSessions();
  const { sessionId, confirm } = req.body;
  if (!confirm) {
    return res.status(400).json({ error: "Confirmation required" });
  }
  const session = importSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found or expired" });
  }
  if (!dbPool) {
    return res.status(503).json({ error: "Database not connected" });
  }

  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    for (const q of session.questions) {
      let attempts = 0;
      let success = false;
      const spName = \`sp_\${q.id.replace(/-/g, '')}\`;
      while (attempts < 2 && !success) {
        try {
          await client.query(\`SAVEPOINT \${spName}\`);
          const category = q.category || q.category_name || 'General';
          const leadInAr = q.lead_in_ar || '';
          
          await client.query(
            "INSERT INTO unified_question_bank (id, specialty_id, category_name, lead_in_ar, lead_in_en, options, correct_option_index, reference_source, explanation_en, fingerprint_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            [q.id, q.specialty_id, category, leadInAr, q.lead_in_en, JSON.stringify(q.options), q.correct_option_index, q.reference_source || '', q.explanation_en, q.fingerprint_hash]
          );
          await client.query(\`RELEASE SAVEPOINT \${spName}\`);
          success = true;
        } catch (e) {
          await client.query(\`ROLLBACK TO SAVEPOINT \${spName}\`);
          attempts++;
          if (attempts >= 2) throw e;
        }
      }
    }
    await client.query("COMMIT");
    importSessions.delete(sessionId);
    return res.json({ success: true, inserted: session.questions.length });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Database commit failed", details: err.message });
  } finally {
    client.release();
  }
});`;

serverCode = serverCode.replace(search3, replace3);

fs.writeFileSync('server.ts', serverCode);
