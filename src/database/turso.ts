import { createClient } from '@libsql/client';
import crypto from 'crypto';

const databaseUrl = 'libsql://lms-haritha.aws-ap-south-1.turso.io';
const databaseToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc5ODg1OTEsImlkIjoiMDFhMDRjNmEtYWUwMS03NzgwLWIwMWUtMzBkZjM0NDJmMDNhIiwia2lkIjoiczdhMVB3Ym1KN1F4eldJa0pjalRkeHFkX0NtSHJTUlp5UVJseW8ySVAyRSIsInR5cCI6IjkwYjlkYjljLTE4ZTctNDlhOS04MDYwLTFkZjcxYmEwZTRkNCJ9.Ruo0JiJFiU1daRlqJW35wBgsbnhN4Ot9N_oV_rOMbNiuUyfdSbZGRAZSIMaHIEGqBDB7l3HQqHFdwjX41x4fDA';

export const turso = createClient({
  url: databaseUrl,
  authToken: databaseToken,
});

export function hashPassword(password: string): string {
  const salt = 'turso_lms_salt_12345';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function initTursoDatabase() {
  console.log('Initializing Turso Database Schema...');
  try {
    // 1. users table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 2. user_profiles table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        status TEXT DEFAULT 'active',
        avatar_url TEXT,
        phone TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        last_login TEXT
      )
    `);

    // 3. courses table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        instructor_id TEXT REFERENCES user_profiles(id),
        category TEXT NOT NULL,
        duration TEXT NOT NULL,
        difficulty TEXT DEFAULT 'beginner',
        status TEXT DEFAULT 'active',
        price TEXT DEFAULT '0',
        thumbnail_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // 4. enrollments table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
        course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
        enrolled_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT,
        progress INTEGER DEFAULT 0,
        UNIQUE(user_id, course_id)
      )
    `);

    // 5. user_progress table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
        completed_lessons TEXT,
        module_stats TEXT
      )
    `);

    // 6. admin_logs table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    console.log('Turso tables verified successfully.');

    // Seed default admin user
    const adminEmail = 'lmsportaladminlogin@gmail.com';
    const adminId = 'admin-user-id-99999';
    const existingAdmin = await turso.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [adminEmail]
    });

    if (existingAdmin.rows.length === 0) {
      const pHash = hashPassword('LMS');
      await turso.execute({
        sql: 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        args: [adminId, adminEmail, pHash]
      });
      await turso.execute({
        sql: 'INSERT INTO user_profiles (id, email, name, role) VALUES (?, ?, ?, ?)',
        args: [adminId, adminEmail, 'LMS Admin', 'admin']
      });
      console.log('Admin user seeded into Turso.');
    }

    // Seed default demo user
    const demoEmail = '23471a4245@nrtec.in';
    const demoId = 'demo-user-id-12345';
    const existingDemo = await turso.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [demoEmail]
    });

    if (existingDemo.rows.length === 0) {
      const pHash = hashPassword('23471a4245');
      await turso.execute({
        sql: 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        args: [demoId, demoEmail, pHash]
      });
      await turso.execute({
        sql: 'INSERT INTO user_profiles (id, email, name, role) VALUES (?, ?, ?, ?)',
        args: [demoId, demoEmail, 'Demo User', 'student']
      });
      console.log('Demo user seeded into Turso.');
    }

  } catch (error) {
    console.error('Error seeding/initializing Turso database:', error);
  }
}
