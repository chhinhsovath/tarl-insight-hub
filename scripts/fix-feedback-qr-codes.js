const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

async function fixFeedbackQrCodes() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Fixing feedback QR code URLs...');
    
    await client.query('BEGIN');

    // Find all feedback QR codes that point to the old URL
    const feedbackQrCodes = await client.query(`
      SELECT id, qr_data, session_id 
      FROM tbl_tarl_qr_codes 
      WHERE code_type = 'feedback' 
      AND qr_data LIKE '%/training/feedback?session=%'
      AND is_active = true
    `);

    console.log(`Found ${feedbackQrCodes.rows.length} feedback QR codes to update`);

    for (const qrCode of feedbackQrCodes.rows) {
      // Update the URL from /training/feedback to /training/public-feedback
      const newQrData = qrCode.qr_data.replace('/training/feedback?', '/training/public-feedback?');
      
      await client.query(`
        UPDATE tbl_tarl_qr_codes 
        SET qr_data = $1, updated_at = NOW() 
        WHERE id = $2
      `, [newQrData, qrCode.id]);

      console.log(`✅ Updated QR code ${qrCode.id} for session ${qrCode.session_id}`);
    }

    await client.query('COMMIT');
    console.log('🎉 All feedback QR codes updated successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing feedback QR codes:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixFeedbackQrCodes()
    .then(() => {
      console.log('✅ Feedback QR codes fix complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to fix feedback QR codes:', error);
      process.exit(1);
    });
}

module.exports = { fixFeedbackQrCodes };