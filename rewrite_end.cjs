const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStart = code.indexOf("// Export app for Netlify Functions serverless-http wrapper");
const targetEnd = code.indexOf("  if (process.env.NODE_ENV !== \"production\") {");

const cleanReplacement = `
app.post('/api/upload-image', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { questionId } = req.body;
    
    if (!file) return res.status(400).json({ success: false, error: 'No image file provided.' });
    if (!questionId) return res.status(400).json({ success: false, error: 'Missing questionId.' });
    
    const qCheck = await executeDbQuery('SELECT id FROM unified_question_bank WHERE id = $1', [questionId]);
    if (!qCheck || qCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found in database.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Server missing Supabase credentials.' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileExt = file.originalname.split('.').pop();
    const fileName = \`\${questionId}_\${Date.now()}.\${fileExt}\`;
    const bucketName = 'question_images';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
      
    if (error) {
      console.error('Supabase Storage Error:', error);
      return res.status(500).json({ success: false, error: 'Failed to upload to storage bucket.' });
    }
    
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const imageUrl = publicUrlData.publicUrl;
    
    const imgId = 'img_' + Date.now() + Math.random().toString(36).substr(2, 5);
    await executeDbQuery(
      \`INSERT INTO question_images (id, question_id, image_url, modality, display_order)
       VALUES ($1, $2, $3, 'clinical', 1)
       ON CONFLICT (question_id, display_order) DO UPDATE SET image_url = EXCLUDED.image_url\`,
      [imgId, questionId, imageUrl]
    );

    return res.json({ success: true, imageUrl });
  } catch (err: any) {
    console.error('Image Upload Error:', err);
    return res.status(500).json({ success: false, error: 'Server error during upload.' });
  }
});

// Export app for Netlify Functions serverless-http wrapper
export default app;
export { app };

// Start Server locally or in standalone container mode
async function startServer() {
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // skip listen in Netlify serverless execution
    return;
  }

`;

code = code.substring(0, targetStart) + cleanReplacement + code.substring(targetEnd);

fs.writeFileSync('server.ts', code);
