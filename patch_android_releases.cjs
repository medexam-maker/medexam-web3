const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Insert DB schema (do it for all occurrences just in case)
const dbSchema = `
      CREATE TABLE IF NOT EXISTS android_releases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR(50) NOT NULL,
        download_url TEXT NOT NULL,
        sha256 VARCHAR(64),
        file_size BIGINT,
        release_notes TEXT,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
`;
code = code.split('CREATE TABLE IF NOT EXISTS app_settings').join(dbSchema + '\n      CREATE TABLE IF NOT EXISTS app_settings');

// 2. Insert apkUpload
const apkUploadStr = `const apkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit\n`;
code = code.replace(
  'const upload = multer(',
  apkUploadStr + 'const upload = multer('
);

// 3. Insert routes
const newRoutes = `

// --- Android APK Distribution Routes ---

app.get('/api/app/latest', async (req, res) => {
  try {
    const result = await executeDbQuery(
      'SELECT id, version, download_url, sha256, file_size, release_notes, created_at FROM android_releases WHERE is_published = TRUE ORDER BY created_at DESC LIMIT 1'
    );
    if (!result || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No published releases found.' });
    }
    return res.json({ success: true, release: result.rows[0] });
  } catch (err) {
    console.error('Error fetching latest release:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

app.get('/api/admin/releases', authenticateAdmin, async (req, res) => {
  try {
    const result = await executeDbQuery('SELECT * FROM android_releases ORDER BY created_at DESC');
    return res.json({ success: true, releases: result?.rows || [] });
  } catch (err) {
    console.error('Error fetching releases:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

app.post('/api/admin/releases', authenticateAdmin, apkUpload.single('apk'), async (req, res) => {
  try {
    const { version, release_notes, is_published } = req.body;
    const file = req.file;
    if (!version) return res.status(400).json({ success: false, error: 'Version is required.' });
    if (!file) return res.status(400).json({ success: false, error: 'APK file is required.' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Server missing Supabase credentials.' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = \`apk/MedExam_\${version.replace(/[^a-zA-Z0-9.-]/g, '_')}_\${Date.now()}.apk\`;
    const bucketName = 'question_images'; // reusing existing bucket since no new one is guaranteed to exist
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true
      });
      
    if (error) {
      console.error('Supabase Storage Error:', error);
      return res.status(500).json({ success: false, error: 'Failed to upload to storage bucket.' });
    }
    
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const download_url = publicUrlData.publicUrl;
    
    // Hash
    const hashSum = crypto.createHash('sha256');
    hashSum.update(file.buffer);
    const sha256 = hashSum.digest('hex');
    
    const file_size = file.buffer.length;
    const published = is_published === 'true' || is_published === true;
    
    const result = await executeDbQuery(
      'INSERT INTO android_releases (version, download_url, sha256, file_size, release_notes, is_published) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [version, download_url, sha256, file_size, release_notes || '', published]
    );
    
    return res.json({ success: true, release: result?.rows[0] });
  } catch (err) {
    console.error('Error creating release:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

app.put('/api/admin/releases/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;
    const result = await executeDbQuery(
      'UPDATE android_releases SET is_published = $1 WHERE id = $2 RETURNING *',
      [is_published, id]
    );
    if (!result || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Release not found.' });
    }
    return res.json({ success: true, release: result.rows[0] });
  } catch (err) {
    console.error('Error updating release:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

app.delete('/api/admin/releases/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeDbQuery('DELETE FROM android_releases WHERE id = $1 RETURNING *', [id]);
    if (!result || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Release not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting release:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

`;
const marker = 'if (process.env.NODE_ENV !== "production") {';
code = code.replace(marker, newRoutes + marker);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts successfully');
