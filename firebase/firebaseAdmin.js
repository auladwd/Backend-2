import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function parseServiceAccount(raw) {
  if (!raw) return null;

  // 1) Try direct JSON first
  try {
    const obj = JSON.parse(raw);

    // Fix common issue: private_key newlines become "\\n" in env
    if (obj?.private_key && typeof obj.private_key === 'string') {
      obj.private_key = obj.private_key.replace(/\\n/g, '\n');
    }

    return obj;
  } catch (_) {}

  // 2) Fallback: assume Base64 -> decode -> JSON
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    const obj = JSON.parse(decoded);

    if (obj?.private_key && typeof obj.private_key === 'string') {
      obj.private_key = obj.private_key.replace(/\\n/g, '\n');
    }

    return obj;
  } catch (e) {
    throw new Error(
      'Invalid Firebase service account value. Provide JSON string or Base64(JSON).'
    );
  }
}

if (!admin.apps.length) {
  try {
    const serviceAccountRaw =
      process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FB_SERVICE_KEY;

    let serviceAccount = parseServiceAccount(serviceAccountRaw);

    if (!serviceAccount) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const serviceAccountPath = path.resolve(
        __dirname,
        'firebase-service-account.json'
      );

      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
          'Missing Firebase service account configuration. Set FIREBASE_SERVICE_ACCOUNT / FB_SERVICE_KEY env or provide firebase-service-account.json.'
        );
      }

      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      if (serviceAccount?.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(
          /\\n/g,
          '\n'
        );
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    // IMPORTANT: fail fast, so you don't later get "default app does not exist"
    console.error('❌ Firebase Admin initialization error:', error.message);
    throw error;
  }
}

export default admin;
