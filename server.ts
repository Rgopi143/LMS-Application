import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import multer from 'multer';
import { google } from 'googleapis';
import fsSync from 'fs';
dotenv.config();

import { turso, initTursoDatabase, hashPassword } from './src/database/turso';
import crypto from 'crypto';

// Helper to sign JWTs
function jwtSign(payload: any): string {
  const exp = payload.exp || (Date.now() + 6 * 60 * 60 * 1000);
  const jwtPayload = { ...payload, exp };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
  const secret = 'turso_auth_secret_key_12345';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Helper to verify JWTs
function jwtVerify(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = 'turso_auth_secret_key_12345';
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }
    return decoded;
  } catch (e) {
    return null;
  }
}

// Convert serialized string arrays/objects back to JS types in SQL results
function parseJSONFields(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      const val = result[key].trim();
      if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
        try {
          result[key] = JSON.parse(val);
        } catch (e) {
          // Not JSON, leave as is
        }
      }
    }
  }
  return result;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = 3000;

  await initTursoDatabase();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS for static frontend integration
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  app.use('/uploads/:filename', async (req, res, next) => {
    const filename = req.params.filename;
    const localPath = path.join(process.cwd(), 'uploads', filename);

    try {
      await fs.access(localPath);
      return res.sendFile(localPath);
    } catch {
      if (!drive) {
        return res.status(404).send('File not found locally and Google Drive is not initialized');
      }

      try {
        console.log(`File ${filename} not found locally. Searching Google Drive fallback...`);
        const cleanName = filename.replace(/^\d+-/, '');
        const driveFiles = await getGoogleFilesCached(PARENT_FOLDER_ID);
        const match = driveFiles.find((f: any) => f.path === cleanName || f.title === cleanName);

        if (match) {
          console.log(`Found matching file on Google Drive: ${match.title} (${match.id}). Streaming...`);
          const driveResponse = await drive.files.get({
            fileId: match.id,
            alt: 'media'
          }, { responseType: 'stream' });

          const contentType = driveResponse.headers['content-type'];
          if (contentType) {
            res.setHeader('content-type', contentType);
          }
          return driveResponse.data.pipe(res);
        } else {
          return res.status(404).send('File not found locally or in Google Drive');
        }
      } catch (err: any) {
        console.error('Local file fallback streaming error:', err.message);
        return res.status(500).send(err.message);
      }
    }
  });
  // MongoDB Connection
  const mongoUri = process.env.MONGODB_URI;
  let db: any;

  if (mongoUri && mongoUri.trim() !== '') {
    // Connect asynchronously so we don't block server startup
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Fail faster if not reachable
    });
    client.connect()
      .then(() => {
        db = client.db();
        console.log('Connected to MongoDB');
      })
      .catch(err => {
        console.warn('Failed to connect to MongoDB. Ensure MONGODB_URI is set in environment variables.', err.message);
      });
  } else {
    console.log('MONGODB_URI not provided, skipping MongoDB connection.');
  }

  // User Progress API (MongoDB)
  app.get('/api/progress/:userId', async (req, res) => {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected or still initializing' });
    }
    try {
      const { userId } = req.params;
      const progress = await db.collection('user_progress').findOne({ userId });
      res.json(progress || { completedLessons: [], moduleStats: {} });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/progress/:userId', async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not connected' });
    try {
      const { userId } = req.params;
      const { completedLessons, moduleStats } = req.body;
      await db.collection('user_progress').updateOne(
        { userId },
        { $set: { completedLessons, moduleStats, updatedAt: new Date() } },
        { upsert: true }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/api/interns/count', async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not connected' });
    try {
      const count = await db.collection('user_progress').countDocuments();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Terminal API
  app.post('/api/terminal', async (req, res) => {
    const { command } = req.body;
    try {
      // For safety, we only allow certain commands or prefix them
      // But for a "VS Code Server" experience, we'll be a bit more flexible
      const { stdout, stderr } = await execAsync(command);
      res.json({ stdout, stderr });
    } catch (error: any) {
      res.status(500).json({ error: error.message, stdout: error.stdout, stderr: error.stderr });
    }
  });

  // File System API for the IDE
  app.get('/api/files', async (req, res) => {
    try {
      const rootPath = process.cwd();
      const files: any[] = [];

      async function walk(dir: string, parentId: string | null = null) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;

          const fullPath = path.join(dir, entry.name);
          const id = Buffer.from(fullPath).toString('base64');

          if (entry.isDirectory()) {
            files.push({
              id,
              name: entry.name,
              type: 'folder',
              parentId,
              isOpen: false
            });
            await walk(fullPath, id);
          } else {
            const content = await fs.readFile(fullPath, 'utf-8');
            files.push({
              id,
              name: entry.name,
              type: 'file',
              parentId,
              content
            });
          }
        }
      }

      await walk(rootPath);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/files/save', async (req, res) => {
    const { id, content } = req.body;
    try {
      const fullPath = Buffer.from(id, 'base64').toString('utf-8');
      await fs.writeFile(fullPath, content, 'utf-8');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/files/create', async (req, res) => {
    const { name, type, parentId } = req.body;
    try {
      let parentPath = process.cwd();
      if (parentId) {
        parentPath = Buffer.from(parentId, 'base64').toString('utf-8');
      }
      const fullPath = path.join(parentPath, name);

      if (type === 'folder') {
        await fs.mkdir(fullPath, { recursive: true });
      } else {
        await fs.writeFile(fullPath, '', 'utf-8');
      }

      res.json({ success: true, id: Buffer.from(fullPath).toString('base64') });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post('/api/files/delete', async (req, res) => {
    const { id } = req.body;
    try {
      const fullPath = Buffer.from(id, 'base64').toString('utf-8');
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Fast multipart upload using multer (no base64 overhead)
  const multerStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const baseDir = path.join(process.cwd(), 'uploads');

        await fs.mkdir(baseDir, { recursive: true });

        cb(null, baseDir);
      } catch (err: any) {
        cb(err, '');
      }
    },
    filename: (req, file, cb) => {
      // Sanitize filename and avoid collisions
      const sanitized = file.originalname.replace(/[^a-zA-Z0-9._\-\s]/g, '_');
      cb(null, sanitized);
    }
  });

  const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200 MB max
  });
  const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "116teUtLJhofUSfVsNzmWPDvzBsNkLFxZ";
  const UPLOADS_FOLDER_NAME = "Application Uploads";

  // Google Drive Authentication
  let auth: any = null;
  let clientEmail = 'your service account email';
  try {
    if (fsSync.existsSync('credentials.json')) {
      const creds = JSON.parse(fsSync.readFileSync('credentials.json', 'utf8'));
      clientEmail = creds.client_email;
      auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    } else if (process.env.GOOGLE_CREDENTIALS) {
      const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      if (creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      }
      clientEmail = creds.client_email || 'your service account email';
      auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
    }
  } catch (err) {
    console.error('Failed to initialize Google Auth:', err);
  }

  const drive = auth ? google.drive({ version: 'v3', auth }) : null;

  // Test connection and folder access on startup
  if (drive) {
    drive.files.get({ fileId: PARENT_FOLDER_ID, fields: 'id, name' })
      .then(res => console.log(`Drive Access Verified: Found parent folder "${res.data.name}"`))
      .catch((err: any) => {
        console.error(`CRITICAL: Drive Access Error for folder ${PARENT_FOLDER_ID}:`, err.message);
        console.warn(`ACTION REQUIRED: Please share your Google Drive folder (${PARENT_FOLDER_ID}) with this email: ${clientEmail} and give it EDITOR access.`);
      });
  }

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!drive) {
        return res.status(503).json({ error: 'Google Drive is not connected.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      console.log(`Uploading file: ${req.file.originalname} directly to: ${PARENT_FOLDER_ID}`);

      const response = await drive.files.create({
        requestBody: {
          name: (req.body.title || req.file.originalname).toLowerCase().endsWith('.pdf') 
            ? (req.body.title || req.file.originalname)
            : `${req.body.title || req.file.originalname}.pdf`,
          parents: [PARENT_FOLDER_ID]
        },
        media: {
          mimeType: req.file.mimetype,
          body: fsSync.createReadStream(req.file.path)
        },
        fields: 'id, name, webViewLink',
        supportsAllDrives: true
      });

      const fileId = response.data.id || '';
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      if (fsSync.existsSync(req.file.path)) {
        fsSync.unlinkSync(req.file.path);
      }

      res.json({
        success: true,
        fileId: fileId,
        fileName: response.data.name,
        previewUrl: `https://drive.google.com/file/d/${fileId}/preview`
      });

    } catch (error: any) {
      console.warn('Google Drive Upload Restricted, using local storage fallback:', error.message);
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file provided' });
        }
        const localUrl = `/uploads/${req.file.filename}`;
        res.json({
          success: true,
          source: 'local',
          fileName: (req.body.title || req.file.originalname),
          previewUrl: localUrl,
          downloadUrl: localUrl,
          message: 'Stored locally (Cloud storage restricted)'
        });
      } catch (err: any) {
        console.error('Local Fallback Error:', err.message);
        res.status(500).json({ error: err.message });
      }
    }
  });

  let googleDriveFilesCache: any[] = [];
  let lastCacheTime = 0;
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

  async function getGoogleFilesCached(folderId: string): Promise<any[]> {
    const now = Date.now();
    if (googleDriveFilesCache.length > 0 && (now - lastCacheTime < CACHE_DURATION)) {
      return googleDriveFilesCache;
    }

    if (!drive) return [];

    console.log(`Fetching Google Drive files recursively for library cache from: ${folderId}`);
    
    async function getAllFilesRecursively(fId: string): Promise<any[]> {
      let allFiles: any[] = [];
      try {
        const response = await drive.files.list({
          q: `'${fId}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, size, webViewLink)',
          pageSize: 1000,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true
        });
        
        const items = response.data.files || [];
        for (const item of items) {
          if (item.mimeType === 'application/pdf' || item.mimeType?.startsWith('image/')) {
            const sizeInMb = item.size ? (parseInt(item.size) / (1024 * 1024)).toFixed(1) + ' MB' : '0.0 MB';
            const isImage = item.mimeType?.startsWith('image/');
            allFiles.push({
              id: item.id,
              title: item.name.replace(/\.[^/.]+$/, ""),
              category: isImage ? 'Images' : 'PDFs',
              size: sizeInMb,
              type: isImage ? 'image' : 'pdf',
              downloadUrl: `/api/drive-proxy?id=${item.id}`,
              thumbnail: isImage ? `/api/drive-proxy?id=${item.id}` : 'https://img.icons8.com/3d-fluency/188/pdf.png',
              source: 'drive',
              path: item.name
            });
          } else if (item.mimeType === 'application/vnd.google-apps.folder') {
            const subFolderFiles = await getAllFilesRecursively(item.id);
            allFiles = allFiles.concat(subFolderFiles);
          }
        }
      } catch (err: any) {
        console.error(`Cache fetch Error traversing folder ${fId}:`, err.message);
      }
      return allFiles;
    }

    try {
      const fetched = await getAllFilesRecursively(folderId);
      googleDriveFilesCache = fetched;
      lastCacheTime = now;
      return googleDriveFilesCache;
    } catch (err: any) {
      console.error('Error fetching/updating Google Drive cache:', err.message);
      return googleDriveFilesCache;
    }
  }

  app.get('/api/test-drive-connection', async (req, res) => {
    try {
      const results: any = {
        driveInitialized: !!drive,
        clientEmail: clientEmail,
        targetFolderId: PARENT_FOLDER_ID,
        folderAccessSuccess: false,
        error: null,
        filesFetchedCount: 0
      };

      if (!drive) {
        results.error = "Google Drive instance is not initialized. Please verify credentials.json or GOOGLE_CREDENTIALS environment variable.";
        return res.json(results);
      }

      try {
        const folderResponse = await drive.files.get({
          fileId: PARENT_FOLDER_ID,
          fields: 'id, name, mimeType',
          supportsAllDrives: true
        });
        results.folderAccessSuccess = true;
        results.folderInfo = folderResponse.data;

        // Try to list files in root parent folder
        const listResponse = await drive.files.list({
          q: `'${PARENT_FOLDER_ID}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType)',
          pageSize: 10,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true
        });
        results.filesFetchedStatus = "success";
        results.filesFetchedCount = (listResponse.data.files || []).length;
      } catch (err: any) {
        results.error = err.message;
      }

      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/drive-proxy', async (req, res) => {
    try {
      const fileId = req.query.id as string;
      if (!fileId) return res.status(400).send('Missing file id');
      if (!drive) return res.status(500).send('Google Drive not initialized');

      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'stream' });

      const contentType = response.headers['content-type'];
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      response.data.pipe(res);
    } catch (err: any) {
      console.error('Drive proxy error:', err.message);
      res.status(500).send(err.message);
    }
  });

  app.get('/api/supabase-files', async (req, res) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const stats = await fs.stat(path.join(uploadsDir, entry.name));
        const ext = path.extname(entry.name).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
        const isPdf = ext === '.pdf';

        if (isImage || isPdf) {
          const downloadUrl = `/uploads/${entry.name}`;
          files.push({
            id: entry.name,
            title: entry.name.replace(/^\d+-/, '').replace(/\.[^/.]+$/, ""),
            category: isImage ? 'Images' : 'PDFs',
            size: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
             type: isImage ? 'image' : 'pdf',
             downloadUrl: downloadUrl,
             thumbnail: isImage ? downloadUrl : 'https://img.icons8.com/3d-fluency/188/pdf.png',
             source: 'local',
             path: entry.name
           });
         }
       }
 
       if (drive) {
         const driveFiles = await getGoogleFilesCached(PARENT_FOLDER_ID);
         files.push(...driveFiles);
       }
 
       res.json(files);
     } catch (error: any) {
       console.error('Local File List Error:', error.message);
       res.json([]);
     }
   });

  app.get('/api/migrate-drive-to-supabase', async (req, res) => {
    try {
      if (!drive) throw new Error('Drive not connected');
      
      const folderId = (req.query.folderId as string) || PARENT_FOLDER_ID;
      console.log(`Starting recursive migration from Drive folder ${folderId} to local storage...`);
      
      async function getAllFilesRecursively(fId: string): Promise<any[]> {
        let allFiles: any[] = [];
        try {
          const response = await drive.files.list({
            q: `'${fId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
          });
          
          const items = response.data.files || [];
          for (const item of items) {
            if (item.mimeType === 'application/pdf' || item.mimeType?.startsWith('image/')) {
              allFiles.push(item);
            } else if (item.mimeType === 'application/vnd.google-apps.folder') {
              const subFolderFiles = await getAllFilesRecursively(item.id);
              allFiles = allFiles.concat(subFolderFiles);
            }
          }
        } catch (err: any) {
          console.error(`Error traversing folder ${fId}:`, err.message);
        }
        return allFiles;
      }

      const files = await getAllFilesRecursively(folderId);
      const results = [];
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      for (const file of files) {
        try {
          console.log(`Migrating: ${file.name}`);
          
          const driveFile = await drive.files.get({
            fileId: file.id,
            alt: 'media'
          }, { responseType: 'arraybuffer' });

          const buffer = Buffer.from(driveFile.data as ArrayBuffer);
          const fileName = `${Date.now()}-${file.name}`;
          const localPath = path.join(uploadsDir, fileName);
          await fs.writeFile(localPath, buffer);
          
          results.push({ name: file.name, status: 'success' });
        } catch (err: any) {
          console.error(`Failed to migrate ${file.name}:`, err.message);
          results.push({ name: file.name, status: 'failed', error: err.message });
        }
      }

      res.json({ success: true, processed: files.length, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Authorization Header Middleware
  app.use((req: any, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwtVerify(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    next();
  });

  // Auth API Router
  app.get('/api/auth/session', (req: any, res) => {
    if (req.user) {
      const token = jwtSign(req.user);
      res.json({
        session: {
          access_token: token,
          user: {
            id: req.user.id,
            email: req.user.email,
            user_metadata: {
              display_name: req.user.email.split('@')[0],
              role: req.user.role
            }
          }
        }
      });
    } else {
      res.json({ session: null });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
      const userResult = await turso.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      });

      if (userResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid login credentials' });
      }

      const user = userResult.rows[0];
      const hashed = hashPassword(password);
      if (user.password_hash !== hashed) {
        return res.status(400).json({ error: 'Invalid login credentials' });
      }

      const profileResult = await turso.execute({
        sql: 'SELECT * FROM user_profiles WHERE id = ?',
        args: [user.id]
      });
      const profile = profileResult.rows[0] || { id: user.id, email: user.email, name: email.split('@')[0], role: 'student' };

      await turso.execute({
        sql: 'UPDATE user_profiles SET last_login = ? WHERE id = ?',
        args: [new Date().toISOString(), user.id]
      });

      const token = jwtSign({ id: user.id, email: user.email, role: profile.role });
      const session = {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            display_name: profile.name,
            role: profile.role
          }
        }
      };
      res.json({ session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
      const existing = await turso.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: [email]
      });
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userId = crypto.randomUUID();
      const pHash = hashPassword(password);

      await turso.execute({
        sql: 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        args: [userId, email, pHash]
      });

      await turso.execute({
        sql: 'INSERT INTO user_profiles (id, email, name, role) VALUES (?, ?, ?, ?)',
        args: [userId, email, name, role || 'student']
      });

      const token = jwtSign({ id: userId, email, role: role || 'student' });
      const session = {
        access_token: token,
        user: {
          id: userId,
          email,
          user_metadata: {
            display_name: name,
            role: role || 'student'
          }
        }
      };
      res.json({ session, user: session.user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/signout', (req, res) => {
    res.json({ success: true });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    res.json({ success: true, message: 'Password reset email simulation successful.' });
  });

  app.post('/api/auth/admin/create-user', async (req: any, res) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
    }
    const { email, password, name, role } = req.body;
    try {
      const existing = await turso.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: [email]
      });
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userId = crypto.randomUUID();
      const pHash = hashPassword(password);

      await turso.execute({
        sql: 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        args: [userId, email, pHash]
      });

      await turso.execute({
        sql: 'INSERT INTO user_profiles (id, email, name, role) VALUES (?, ?, ?, ?)',
        args: [userId, email, name, role || 'student']
      });

      res.json({
        user: {
          id: userId,
          email,
          user_metadata: {
            name,
            role
          }
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/admin/delete-user', async (req: any, res) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
    }
    const { id } = req.body;
    try {
      await turso.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [id]
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DB Direct Custom Queries Proxy Endpoint
  app.post('/api/db-query', async (req: any, res) => {
    const {
      table,
      method,
      selectColumns,
      bodyData,
      filters,
      orderColumn,
      orderAscending,
      limitCount,
      isSingle,
      isExactCount
    } = req.body;

    try {
      let sql = '';
      let args: any[] = [];

      let whereClause = '';
      const filterArgs: any[] = [];
      if (filters && filters.length > 0) {
        const clauses = filters.map((f: any) => {
          if (f.op === 'eq') {
            filterArgs.push(f.value);
            return `"${f.field}" = ?`;
          }
          if (f.op === 'not_is') {
            if (f.value === null) {
              return `"${f.field}" IS NOT NULL`;
            } else {
              filterArgs.push(f.value);
              return `"${f.field}" != ?`;
            }
          }
          return '1=1';
        });
        whereClause = ' WHERE ' + clauses.join(' AND ');
      }

      if (method === 'select') {
        if (isExactCount) {
          sql = `SELECT COUNT(*) AS count FROM "${table}"` + whereClause;
          args = [...filterArgs];
          const countRes = await turso.execute({ sql, args });
          const count = Number(countRes.rows[0]?.count || 0);
          return res.json({ data: [], count, error: null });
        }

        sql = `SELECT ${selectColumns === '*' ? '*' : selectColumns} FROM "${table}"` + whereClause;
        args = [...filterArgs];

        if (orderColumn) {
          sql += ` ORDER BY "${orderColumn}" ${orderAscending ? 'ASC' : 'DESC'}`;
        }
        if (limitCount !== null) {
          sql += ` LIMIT ${limitCount}`;
        }

        const queryRes = await turso.execute({ sql, args });
        let data = queryRes.rows.map(row => parseJSONFields(row));
        if (isSingle) {
          data = data[0] || null;
        }
        return res.json({ data, count: null, error: null });

      } else if (method === 'insert') {
        const items = Array.isArray(bodyData) ? bodyData : [bodyData];
        const insertedRows = [];

        for (const item of items) {
          const keys = Object.keys(item);
          const fields = keys.map(k => `"${k}"`).join(', ');
          const placeholders = keys.map(() => '?').join(', ');
          const insertSql = `INSERT INTO "${table}" (${fields}) VALUES (${placeholders})`;
          const insertArgs = keys.map(k => {
            if (typeof item[k] === 'object' && item[k] !== null) {
              return JSON.stringify(item[k]);
            }
            return item[k];
          });

          await turso.execute({ sql: insertSql, args: insertArgs });

          let selectSql = '';
          let selectArgs: any[] = [];
          if (item.id) {
            selectSql = `SELECT * FROM "${table}" WHERE id = ?`;
            selectArgs = [item.id];
          } else if (item.user_id) {
            selectSql = `SELECT * FROM "${table}" WHERE user_id = ?`;
            selectArgs = [item.user_id];
          } else {
            selectSql = `SELECT * FROM "${table}" WHERE rowid = last_insert_rowid()`;
          }

          const selectRes = await turso.execute({ sql: selectSql, args: selectArgs });
          if (selectRes.rows.length > 0) {
            insertedRows.push(parseJSONFields(selectRes.rows[0]));
          }
        }

        const data = Array.isArray(bodyData) ? insertedRows : (insertedRows[0] || null);
        return res.json({ data, count: null, error: null });

      } else if (method === 'update') {
        const keys = Object.keys(bodyData);
        const setClause = keys.map(k => `"${k}" = ?`).join(', ');
        sql = `UPDATE "${table}" SET ${setClause}` + whereClause;
        
        const updateArgs = keys.map(k => {
          if (typeof bodyData[k] === 'object' && bodyData[k] !== null) {
            return JSON.stringify(bodyData[k]);
          }
          return bodyData[k];
        });

        args = [...updateArgs, ...filterArgs];
        await turso.execute({ sql, args });

        const selectSql = `SELECT * FROM "${table}"` + whereClause;
        const selectRes = await turso.execute({ sql: selectSql, args: filterArgs });
        let data = selectRes.rows.map(row => parseJSONFields(row));
        if (isSingle) {
          data = data[0] || null;
        }
        return res.json({ data, count: null, error: null });

      } else if (method === 'delete') {
        sql = `DELETE FROM "${table}"` + whereClause;
        args = [...filterArgs];
        await turso.execute({ sql, args });
        return res.json({ data: null, count: null, error: null });
      }

      res.status(400).json({ error: `Method ${method} not handled.` });
    } catch (err: any) {
      console.error('Error executing query:', err);
      res.status(500).json({ data: null, count: null, error: err.message });
    }
  });

  // DB RPCS Endpoint
  app.post('/api/db-rpc', async (req: any, res) => {
    const { fnName, params } = req.body;
    
    if (fnName === 'log_admin_action') {
      try {
        const adminId = req.user?.id || 'demo-admin-001';
        const logId = crypto.randomUUID();
        await turso.execute({
          sql: `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, old_values, new_values, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            logId,
            adminId,
            params.p_action,
            params.p_target_type || null,
            params.p_target_id || null,
            params.p_old_values ? JSON.stringify(params.p_old_values) : null,
            params.p_new_values ? JSON.stringify(params.p_new_values) : null,
            req.ip || '127.0.0.1',
            req.headers['user-agent'] || 'unknown'
          ]
        });
        res.json({ data: null, error: null });
      } catch (err: any) {
        res.status(500).json({ data: null, error: err.message });
      }
    } else {
      res.status(400).json({ error: `RPC function ${fnName} not supported.` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
