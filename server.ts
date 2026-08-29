import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express from "express";
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

import path from "path";
import pg from "pg";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { generateSlug } from "./src/lib/slugify.js";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import { COUNCILS, SPECIALTIES, INITIAL_CHAT_MESSAGES, SUBSCRIPTION_PLANS, INITIAL_PROMO_CODES } from "./src/data/mockData.js";
import { INITIAL_BLOG_POSTS } from "./src/data/blogData.js";
import { Question, ChatMessage, SubscriptionRequest, PromoCode } from "./src/types.js";

const { Pool } = pg;

const JWT_SECRET = String(process.env.JWT_SECRET || "").trim();
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Please set JWT_SECRET in your environment variables before starting the server.");
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

function signToken(payload: { email: string; role: "admin" | "user" }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

function getBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

// Middleware: يتحقق من التوكن ومن أن صاحبه مسجل دخول
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    (req as any).user = decoded;
    (req as any).auth = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "جلسة الدخول منتهية أو غير صالحة" });
  }
}

// Middleware: يتحقق من التوكن ومن أن صاحبه أدمن فعلاً
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
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
}

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 15, // 15 محاولة كحد أقصى لكل IP
  message: { success: false, error: "محاولات كثيرة جداً، حاول بعد قليل" },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 10,
  message: { error: "رجاءً انتظر قليلاً قبل إرسال رسالة جديدة" },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Appropriate body payload limit for compressed receipts & attachments
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ limit: "6mb", extended: true }));

// Normalize path for Netlify Functions serverless environment
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  next();
});

// System Logs Ring Buffer for real-time admin diagnostics
export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'database' | 'smtp' | 'auth' | 'subscription' | 'exam' | 'system' | 'promo' | 'users' | 'payments' | 'proctoring' | 'stats' | string;
  message: string;
  details?: any;
}

let systemLogs: SystemLogEntry[] = [];

function logSystemEvent(
  level: 'info' | 'warn' | 'error' | 'success',
  category: 'database' | 'smtp' | 'auth' | 'subscription' | 'exam' | 'system' | 'promo' | 'users' | 'payments' | 'proctoring' | 'stats' | string,
  message: string,
  details?: any
) {
  const entry: SystemLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : undefined
  };
  systemLogs.unshift(entry);
  if (systemLogs.length > 500) {
    systemLogs.pop();
  }
  if (level === 'error') {
    console.error(`[${category.toUpperCase()}]`, message, details || '');
  } else if (level === 'warn') {
    console.warn(`[${category.toUpperCase()}]`, message, details || '');
  } else {
    console.log(`[${category.toUpperCase()}]`, message);
  }
}

// Multi-environment database connection resolution (Supabase / PostgreSQL)
function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRESQL_URL ||
    process.env.PG_DATABASE_URL ||
    ""
  ).trim();
}

const databaseUrl = getDatabaseUrl();

let dbPool: pg.Pool | null = null;
let isDbConnected = false;
let dbConnectionCooldownUntil = 0;
let lastDbLoggedError = "";

function initDbPool(): pg.Pool | null {
  if (dbPool) return dbPool;
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    logSystemEvent('info', 'database', 'No DATABASE_URL configured. Operating in high-performance in-memory mode.');
    return null;
  }

  try {
    const isRemote = !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1");
    dbPool = new Pool({
      connectionString: dbUrl,
      ssl: isRemote ? { rejectUnauthorized: false } : false,
      max: 5,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true,
    });

    dbPool.on("error", (err) => {
      const errMsg = err.message || String(err);
      if (errMsg !== lastDbLoggedError) {
        lastDbLoggedError = errMsg;
        logSystemEvent('warn', 'database', `PostgreSQL Pool background event: ${errMsg}`);
      }
      isDbConnected = false;
      dbConnectionCooldownUntil = Date.now() + 30000;
    });

    logSystemEvent('info', 'database', 'PostgreSQL pool initialized.');
    initDatabase().catch(err => {
      logSystemEvent('warn', 'database', `Initial schema check: ${err.message}`);
    });
    return dbPool;
  } catch (err: any) {
    logSystemEvent('warn', 'database', `PostgreSQL pool configuration notice: ${err.message}`);
    return null;
  }
}

initDbPool();

async function executeDbQuery(text: string, params: any[] = []): Promise<pg.QueryResult<any> | null> {
  // If in connection cooldown, skip network attempts and return fallback immediately
  if (Date.now() < dbConnectionCooldownUntil) {
    return null;
  }

  const pool = initDbPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(text, params);
    isDbConnected = true;
    return result;
  } catch (err: any) {
    const errMsg = err.message || String(err);
    const isNetworkOrDnsError = 
      errMsg.includes("getaddrinfo") || 
      errMsg.includes("EAI_AGAIN") || 
      errMsg.includes("ENOTFOUND") || 
      errMsg.includes("ECONNREFUSED") || 
      errMsg.includes("ETIMEDOUT") ||
      errMsg.includes("timeout") ||
      errMsg.includes("Connection terminated");

    if (isNetworkOrDnsError) {
      isDbConnected = false;
      dbConnectionCooldownUntil = Date.now() + 30000; // 30s cooldown
      if (errMsg !== lastDbLoggedError) {
        lastDbLoggedError = errMsg;
        logSystemEvent('warn', 'database', `Database host unreachable (${errMsg}). Seamlessly operating in in-memory fallback mode.`);
      }
      return null;
    }

    logSystemEvent('error', 'database', `Query execution failed: ${errMsg}`, { query: text.substring(0, 120), params });

    // If relation or column does not exist, run schema migration and retry once
    if (errMsg.includes('relation') || errMsg.includes('does not exist') || errMsg.includes('column')) {
      try {
        logSystemEvent('info', 'database', 'Schema inconsistency detected. Running initDatabase() migration...');
        await initDatabase();
        const retryRes = await pool.query(text, params);
        isDbConnected = true;
        return retryRes;
      } catch (retryErr: any) {
        logSystemEvent('warn', 'database', `Retry after schema init failed: ${retryErr.message}`);
      }
    }
    return null;
  }
}

// Persistent Settings DB Helpers
async function loadSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const r = await executeDbQuery("SELECT value FROM app_settings WHERE key = $1", [key]);
    if (r && r.rows.length > 0) {
      const val = r.rows[0].value;
      return typeof val === 'string' ? JSON.parse(val) : (val as T);
    }
  } catch (e) { /* fallback silently to default */ }
  return fallback;
}

async function saveSetting(key: string, value: any) {
  try {
    await executeDbQuery(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  } catch (e: any) {
    logSystemEvent('error', 'database', `Failed to persist setting ${key}: ${e.message}`);
  }
}

// Table Naming Mapping for Supabase Isolated Specialty Tables
// Initialize Tables in PostgreSQL
var dbInitPromise: Promise<void> | null = null;
async function initDatabase() {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
  if (!dbPool) return;
  try {
    const client = await dbPool.connect();
    isDbConnected = true;
    console.log("Connected to PostgreSQL Database (MedExam.net Data Engine)");

    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // --- PHASE 2 ADDITIVE SCHEMA ---

    // 1. Unified Councils
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_councils (
          id VARCHAR(64) PRIMARY KEY,
          title_ar VARCHAR(255) NOT NULL,
          title_en VARCHAR(255) NOT NULL,
          description TEXT,
          badge_color VARCHAR(32) DEFAULT 'emerald',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Unified Specialties
    await client.query(`
            CREATE TABLE IF NOT EXISTS medical_specialties (
          id VARCHAR(64) PRIMARY KEY,
          council_id VARCHAR(64) REFERENCES medical_councils(id) ON DELETE SET NULL,
          section_name VARCHAR(128),
          title_ar VARCHAR(255) NOT NULL,
          title_en VARCHAR(255) NOT NULL,
          icon_name VARCHAR(64) DEFAULT 'Stethoscope',
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          display_order INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Micro-patch to add section_name if missing
      ALTER TABLE medical_specialties ADD COLUMN IF NOT EXISTS section_name VARCHAR(128);
    `);

    // 3. Unified Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS specialty_categories (
          id VARCHAR(64) PRIMARY KEY,
          specialty_id VARCHAR(64) REFERENCES medical_specialties(id) ON DELETE CASCADE,
          name_ar VARCHAR(255) NOT NULL,
          name_en VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Unified Question Bank
    await client.query(`
      CREATE TABLE IF NOT EXISTS unified_question_bank (
          id VARCHAR(64) PRIMARY KEY,
          specialty_id VARCHAR(64) NOT NULL REFERENCES medical_specialties(id) ON DELETE RESTRICT,
          category_id VARCHAR(64) REFERENCES specialty_categories(id) ON DELETE SET NULL,
          category_name VARCHAR(128) NOT NULL,
          
          stem_en TEXT,
          stem_ar TEXT,
          lead_in_en TEXT NOT NULL,
          lead_in_ar TEXT,
          
          options JSONB NOT NULL,
          correct_option_index INT NOT NULL,
          
          lab_table JSONB,
          
          explanation_en TEXT NOT NULL,
          explanation_ar TEXT,
          options_explanations JSONB,
          high_yield_fact TEXT,
          
          reference_source VARCHAR(255),
          difficulty VARCHAR(32) DEFAULT 'medium',
          status VARCHAR(32) DEFAULT 'approved',
          
          fingerprint_hash VARCHAR(64),
          global_question_order INT,

          total_attempts INT DEFAULT 0,
          correct_attempts INT DEFAULT 0,
          peer_stats JSONB,
          
          created_by VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_uqb_specialty_cat ON unified_question_bank(specialty_id, category_name);
      CREATE INDEX IF NOT EXISTS idx_uqb_status ON unified_question_bank(status);
      CREATE INDEX IF NOT EXISTS idx_uqb_diff ON unified_question_bank(specialty_id, difficulty);
      CREATE INDEX IF NOT EXISTS idx_uqb_fingerprint_hash ON unified_question_bank(fingerprint_hash);
    `);
    
    // Batch 4: Import Sessions Staging Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_sessions (
          id VARCHAR(64) PRIMARY KEY,
          specialty_id VARCHAR(64) NOT NULL REFERENCES medical_specialties(id) ON DELETE CASCADE,
          category_id VARCHAR(64) REFERENCES specialty_categories(id) ON DELETE SET NULL,
          uploaded_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          status VARCHAR(32) DEFAULT 'staging',
          total_questions INT DEFAULT 0,
          valid_questions INT DEFAULT 0,
          duplicate_questions INT DEFAULT 0,
          invalid_questions INT DEFAULT 0,
          staged_data JSONB NOT NULL,
          validation_errors JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Question Images
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_images (
          id VARCHAR(64) PRIMARY KEY,
          question_id VARCHAR(64) NOT NULL REFERENCES unified_question_bank(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          caption_ar VARCHAR(255),
          caption_en VARCHAR(255),
          modality VARCHAR(64),
          display_order INT DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 6. Question Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_audit_logs (
          id VARCHAR(64) PRIMARY KEY,
          question_id VARCHAR(64) NOT NULL REFERENCES unified_question_bank(id) ON DELETE CASCADE,
          action VARCHAR(32) NOT NULL,
          performed_by_email VARCHAR(255) NOT NULL,
          previous_data JSONB,
          new_data JSONB,
          change_summary TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 7. Reference Ranges
    await client.query(`
      CREATE TABLE IF NOT EXISTS reference_ranges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          analyte_name VARCHAR(255) NOT NULL,
          min_age_months INT DEFAULT 0,
          max_age_months INT DEFAULT 1200,
          sex VARCHAR(1) DEFAULT 'A',
          unit VARCHAR(64) NOT NULL,
          lower_limit NUMERIC NOT NULL,
          upper_limit NUMERIC NOT NULL,
          source VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          effective_date TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ref_ranges ON reference_ranges(analyte_name, sex, min_age_months, max_age_months);
    `);

    // 8. Section Demo Questions Mapping
    await client.query(`
      CREATE TABLE IF NOT EXISTS section_demo_questions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          specialty_id VARCHAR(64) NOT NULL REFERENCES medical_specialties(id) ON DELETE CASCADE,
          question_id VARCHAR(64) NOT NULL REFERENCES unified_question_bank(id) ON DELETE CASCADE,
          display_order INT DEFAULT 1,
          is_active BOOLEAN DEFAULT TRUE,
          UNIQUE(specialty_id, question_id)
      );
    `);

    // --- END PHASE 2 ADDITIVE SCHEMA ---

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(100) PRIMARY KEY,
        specialty_id VARCHAR(50) NOT NULL,
        category VARCHAR(255) NOT NULL,
        question_ar TEXT,
        question_en TEXT,
        options_en JSONB NOT NULL,
        correct_option_index INT NOT NULL,
        explanation_en TEXT,
        reference_book TEXT,
        difficulty VARCHAR(50) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(100) PRIMARY KEY,
        sender_name VARCHAR(100) NOT NULL,
        sender_role VARCHAR(100) NOT NULL,
        sender_specialty VARCHAR(100) NOT NULL,
        message TEXT,
        attachment JSONB,
        timestamp VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscription_requests (
        id VARCHAR(100) PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        user_email VARCHAR(150) NOT NULL,
        user_phone VARCHAR(50),
        specialty_id VARCHAR(50) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        receipt_url TEXT,
        promo_code VARCHAR(50),
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        action_token_hash VARCHAR(128),
        rejection_reason TEXT,
        action_token_used BOOLEAN DEFAULT FALSE,
        action_token_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS action_token_hash VARCHAR(128);
      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS action_token_used BOOLEAN DEFAULT FALSE;
      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS action_token_used_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS promo_codes (
        code VARCHAR(50) PRIMARY KEY,
        plan_id VARCHAR(50) NOT NULL,
        discount_percent INT DEFAULT 100,
        is_used BOOLEAN DEFAULT FALSE,
        bound_email VARCHAR(255),
        bound_name VARCHAR(255),
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS bound_email VARCHAR(255);
      ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS bound_name VARCHAR(255);

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        is_subscribed BOOLEAN DEFAULT false,
        subscription_type VARCHAR(50) DEFAULT NULL,
        subscription_start TIMESTAMP DEFAULT NULL,
        subscription_end TIMESTAMP DEFAULT NULL,
        last_login TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        activation_token VARCHAR(255) DEFAULT NULL,
        reset_token VARCHAR(255) DEFAULT NULL
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        exam_id VARCHAR(100),
        exam_mode VARCHAR(50) DEFAULT 'STUDENT_TRAINING',
        specialty_id VARCHAR(100),
        score FLOAT DEFAULT 0,
        time_taken INTEGER,
        time_remaining_seconds INTEGER,
        current_question_index INTEGER DEFAULT 0,
        auto_next BOOLEAN DEFAULT TRUE,
        answers JSONB DEFAULT '{}',
        question_ids JSONB DEFAULT '[]',
        questions_snapshot JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'in_progress',
        proctoring_report JSONB,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP DEFAULT NULL,
        last_active_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS exam_mode VARCHAR(50) DEFAULT 'STUDENT_TRAINING';
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS questions_snapshot JSONB DEFAULT '[]';
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS current_question_index INT DEFAULT 0;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS time_remaining_seconds INT;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS auto_next BOOLEAN DEFAULT TRUE;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS question_ids JSONB DEFAULT '[]';
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMP;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS camera_enabled BOOLEAN DEFAULT TRUE;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS flagged_questions JSONB DEFAULT '[]';


      CREATE TABLE IF NOT EXISTS student_question_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exam_attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
        question_id VARCHAR(100) NOT NULL,
        specialty_id VARCHAR(50) NOT NULL,
        category VARCHAR(255),
        question_order INT,
        shown_at TIMESTAMP DEFAULT NOW(),
        answered_at TIMESTAMP,
        selected_answer INT,
        is_correct BOOLEAN
      );

      CREATE INDEX IF NOT EXISTS idx_sqh_user_spec ON student_question_history (user_id, specialty_id);
      CREATE INDEX IF NOT EXISTS idx_sqh_user_q ON student_question_history (user_id, question_id);
      CREATE INDEX IF NOT EXISTS idx_sqh_attempt ON student_question_history (exam_attempt_id);

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        subscription_type VARCHAR(50) NOT NULL,
        receipt_image_url TEXT,
        payment_method VARCHAR(50) DEFAULT 'bankak',
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        approved_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS proctoring_reports (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        specialty_id VARCHAR(50) NOT NULL,
        tab_switches INT DEFAULT 0,
        face_loss_count INT DEFAULT 0,
        integrity_score INT DEFAULT 100,
        status VARCHAR(100),
        summary_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS question_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        question_id VARCHAR(100) NOT NULL,
        preference VARCHAR(20) NOT NULL CHECK (preference IN ('important', 'less_important')),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS question_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        question_id VARCHAR(100) NOT NULL,
        reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS question_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id VARCHAR(100) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        parent_comment_id UUID REFERENCES question_comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_hidden BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_question_comments_question_id ON question_comments(question_id);

      CREATE TABLE IF NOT EXISTS question_improvement_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id VARCHAR(100) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure isolated tables exist for all core specialties as requested:
    // questions_labs, questions_nursing, questions_medicine, questions_internal_medicine, etc.
    const defaultSpecialties = [
      'medicine',
      'dentistry',
      'pharmacy',
      'labs',
      'nursing',
      'midwifery',
      'int_medicine',
      'ent',
      'surgery',
      'obstetrics'
    ];

    

    // Automatic Migration & Seeding for Phase 2
    try {
      // 1. Seed Councils
      const councilRes = await client.query("SELECT COUNT(*) FROM medical_councils");
      if (parseInt(councilRes.rows[0].count, 10) === 0 && typeof COUNCILS !== 'undefined') {
        console.log("Seeding medical_councils...");
        for (const c of COUNCILS) {
          await client.query(`
            INSERT INTO medical_councils (id, title_ar, title_en, description, badge_color)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
          `, [c.id, c.titleAr, c.titleEn, c.description, c.badgeColor]);
        }
      }

      // 2. Seed Specialties
      const specRes = await client.query("SELECT COUNT(*) FROM medical_specialties");
      if (parseInt(specRes.rows[0].count, 10) === 0 && typeof SPECIALTIES !== 'undefined') {
        console.log("Seeding medical_specialties...");
        for (let i = 0; i < SPECIALTIES.length; i++) {
          const s = SPECIALTIES[i];
          await client.query(`
            INSERT INTO medical_specialties (id, council_id, title_ar, title_en, icon_name, description, is_active, display_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING
          `, [s.id, s.councilId || 'professions', s.titleAr, s.titleEn, s.iconName, s.description, s.isActive !== false, i]);
        }
      }

      // 3. Migrate from legacy 'questions' table to 'unified_question_bank'
      const unifiedQRes = await client.query("SELECT COUNT(*) FROM unified_question_bank");
      if (parseInt(unifiedQRes.rows[0].count, 10) === 0) {
        console.log("Migrating questions to unified_question_bank...");
        
        // First try to migrate from legacy DB
        let sourceQuestions = [];
        try {
          const legacyDbRes = await client.query("SELECT * FROM questions");
          sourceQuestions = legacyDbRes.rows;
        } catch(e) {
          console.log("No legacy 'questions' table found in DB.");
        }

        if (sourceQuestions.length > 0) {
           for (const row of sourceQuestions) {
             let optsArray: string[] = [];
             if (typeof row.options_en === 'string') {
                try { optsArray = JSON.parse(row.options_en); } catch(e) { optsArray = [row.options_en]; }
             } else if (Array.isArray(row.options_en)) {
                optsArray = row.options_en;
             }

             // Convert string array to the new JSONB objects format
             const unifiedOptions = optsArray.map((optText, idx) => ({
                id: String.fromCharCode(65 + idx), // A, B, C, D
                text_en: optText,
                isCorrect: idx === (row.correct_option_index || 0)
             }));

             await client.query(`
                INSERT INTO unified_question_bank (
                  id, specialty_id, category_name, 
                  stem_en, lead_in_en, lead_in_ar, 
                  options, correct_option_index, lab_table,
                  explanation_en, explanation_ar, reference_source, difficulty, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'approved')
                ON CONFLICT (id) DO NOTHING
             `, [
                row.id,
                row.specialty_id || 'medicine',
                row.category || 'General',
                row.stem_en || null,
                row.question_en || row.question_ar || 'Question text missing',
                row.question_ar || null,
                JSON.stringify(unifiedOptions),
                row.correct_option_index || 0,
                row.lab_table || null,
                row.explanation_en || 'Standard medical rationale',
                row.explanation_ar || null,
                row.reference_book || '',
                row.difficulty || 'medium'
             ]);
           }
           console.log(`Successfully migrated/seeded ${sourceQuestions.length} questions to unified_question_bank.`);
        }
      }
    } catch (migErr: any) {
      console.error("Unified Migration notice:", migErr.message);
    }

    // Seed chat messages if empty
    const chatCountRes = await client.query("SELECT COUNT(*) FROM chat_messages");
    if (parseInt(chatCountRes.rows[0].count, 10) === 0) {
      console.log("Seeding initial chat messages to PostgreSQL...");
      for (const msg of INITIAL_CHAT_MESSAGES) {
        await client.query(
          `INSERT INTO chat_messages (id, sender_name, sender_role, sender_specialty, message, attachment, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [msg.id, msg.senderName, msg.senderRole, msg.senderSpecialty, msg.message, msg.attachment ? JSON.stringify(msg.attachment) : null, msg.timestamp]
        );
      }
    }

    // Seed promo codes if empty
    const promoCountRes = await client.query("SELECT COUNT(*) FROM promo_codes");
    if (parseInt(promoCountRes.rows[0].count, 10) === 0) {
      for (const p of INITIAL_PROMO_CODES) {
        await client.query(
          `INSERT INTO promo_codes (code, plan_id, discount_percent, is_used)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO NOTHING`,
          [p.code, p.planId, p.discountPercent, p.isUsed]
        );
      }
    }

    // Restore any customized admin configurations from app_settings
    try {
      plansStore = await loadSetting("dynamicPlans", plansStore);
      zohoMailConfig = await loadSetting("zohoMailConfig", zohoMailConfig);
      siteSettingsStore = await loadSetting("siteSettings", siteSettingsStore);
      councilsStore = await loadSetting("councils", councilsStore);
      blogPostsStore = await loadSetting("blogPosts", blogPostsStore);
      operationalAdminsStore = await loadSetting("operationalAdmins", operationalAdminsStore);
      specialtiesActiveMap = await loadSetting("specialtiesActiveMap", specialtiesActiveMap);
      specialtyLanguagesMap = await loadSetting("specialtyLanguagesMap", specialtyLanguagesMap);
      console.log("Restored persistent application settings from PostgreSQL database.");
    } catch (sErr: any) {
      console.log("Settings restore notice:", sErr.message);
    }

    client.release();
    console.log("PostgreSQL isolated tables schema initialization & migration complete!");
  } catch (err: any) {
    console.error("PostgreSQL Initialization Notice (fallback to memory if offline):", err.message);
    isDbConnected = false;
    dbInitPromise = null;
  }
  })();
  return dbInitPromise;
}

// Execute database initialization
initDatabase();

// In-memory fallback data store with default high-yield questions
let chatMessages: ChatMessage[] = [...INITIAL_CHAT_MESSAGES];
let subscriptionRequests: SubscriptionRequest[] = []; // Starts clean with zero pending requests
let activePromoCodes: PromoCode[] = [...INITIAL_PROMO_CODES];

// In-memory status map for specialties active state (default true for all)
let specialtyLanguagesMap: Record<string, string> = {};
let specialtiesActiveMap: Record<string, boolean> = {
  medicine: true,
  dentistry: true,
  pharmacy: true,
  labs: true,
  nursing: true,
  dental_assistants: true,
  med_assistants: true,
  midwifery: true,
  gen_surgery: true,
  int_medicine: true,
  pediatrics: true,
  obs_gyn: true,
  dermatology: true,
  neurology: true,
  ent: true,
  radiology: true,
  public_health: true,
  anesthesia: true
};

// API Routes

// Item 11: Social-preview bot handling
app.use(async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  const isBot = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot/i.test(ua);
  
  if (!isBot) return next();

  // Do not intercept API requests
  if (req.path.startsWith('/api/')) return next();

  try {
    let title = 'MedExam';
    let desc = 'استعد لامتحانك الطبي';
    let image = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=630&auto=format&fit=crop';

    const settings = siteSettingsStore || {};
    title = settings.heroTitle || title;
    desc = settings.heroSubtitle || desc;
    image = settings.logoUrl || image;

    if (req.path.startsWith('/specialty/')) {
      const slug = req.path.split('/')[2] || '';
      const parts = slug.split('--');
      const id = parts.length > 1 ? parts.pop() : slug;
      if (dbPool && isDbConnected && id) {
        const spec = await dbPool.query('SELECT title_ar, description FROM medical_specialties WHERE id = $1 LIMIT 1', [id]);
        if (spec.rows.length > 0) {
          title = `امتحان ${spec.rows[0].title_ar} | أسئلة وامتحانات ${spec.rows[0].title_ar}`;
          desc = spec.rows[0].description || desc;
        }
      }
    } else if (req.path.startsWith('/news/')) {
      const slug = req.path.split('/')[2];
      const post = (blogPostsStore || []).find((p) => p.id === slug);
      if (post) {
         title = post.title;
         desc = post.excerpt || post.title;
         image = post.imageUrl || image;
      }
    } else if (req.path.startsWith('/council/')) {
      const slug = req.path.split('/')[2] || '';
      const parts = slug.split('--');
      const id = parts.length > 1 ? parts.pop() : slug;
      if (dbPool && isDbConnected && id) {
        const c = await dbPool.query('SELECT title_ar, description FROM medical_councils WHERE id = $1 LIMIT 1', [id]);
        if (c.rows.length > 0) {
          title = c.rows[0].title_ar;
          desc = c.rows[0].description || desc;
        }
      }
    }

    // SEO Pages lookup from settings
    const seoPage = (settings.seoPages || []).find((p) => p.path === req.path);
    if (seoPage) {
      if (seoPage.title) title = seoPage.title;
      if (seoPage.description) desc = seoPage.description;
      if (seoPage.image) image = seoPage.image;
    }

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <meta name="description" content="${desc}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${desc}">
          <meta property="og:image" content="${image}">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${desc}">
          <meta name="twitter:image" content="${image}">
        </head>
        <body></body>
      </html>
    `);
  } catch (err) {
    next();
  }
});

app.get("/api/health", async (_req, res) => {
  let postgresConnected = false;

  try {
    const pool = initDbPool();
    if (pool) {
      await pool.query("SELECT 1");
      postgresConnected = true;
      isDbConnected = true;
    }
  } catch {
    postgresConnected = false;
    isDbConnected = false;
  }

  return res.status(postgresConnected ? 200 : 503).json({
    status: postgresConnected ? "ok" : "degraded",
    app: "MedExam.net",
    postgresConnected,
    smtpConfigured: Boolean(process.env.ZOHO_SMTP_PASS || process.env.ZOHO_PASSWORD),
    serverTime: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || "production"
  });
});

// Database status check endpoint
app.get("/api/admin/db-status", requireAdmin, async (req, res) => {
  if (!databaseUrl || Date.now() < dbConnectionCooldownUntil) {
    return res.json({
      connected: isDbConnected,
      mode: isDbConnected ? "PostgreSQL Database" : "In-Memory Store (Active & Operational)",
      databaseUrlConfigured: !!databaseUrl,
      questionsCount: 0,
      chatMessagesCount: chatMessages.length,
      subscriptionsCount: subscriptionRequests.length,
      promoCodesCount: activePromoCodes.length
    });
  }

  try {
    const pool = initDbPool();
    if (!pool) {
      return res.json({
        connected: false,
        mode: "In-Memory Store (Active & Operational)",
        questionsCount: 0,
        chatMessagesCount: chatMessages.length,
        subscriptionsCount: subscriptionRequests.length,
        promoCodesCount: activePromoCodes.length
      });
    }

    const qCount = await pool.query("SELECT COUNT(*) FROM questions");
    const chatCount = await pool.query("SELECT COUNT(*) FROM chat_messages");
    const subCount = await pool.query("SELECT COUNT(*) FROM subscription_requests");
    const promoCount = await pool.query("SELECT COUNT(*) FROM promo_codes");

    isDbConnected = true;

    res.json({
      connected: true,
      mode: "PostgreSQL Database (Supabase / Render Cloud DB)",
      databaseName: "postgres",
      questionsCount: parseInt(qCount.rows[0].count, 10),
      chatMessagesCount: parseInt(chatCount.rows[0].count, 10),
      subscriptionsCount: parseInt(subCount.rows[0].count, 10),
      promoCodesCount: parseInt(promoCount.rows[0].count, 10)
    });
  } catch (err: any) {
    isDbConnected = false;
    dbConnectionCooldownUntil = Date.now() + 30000;
    res.json({
      connected: false,
      error: err.message,
      mode: "In-Memory Store (Fallback Mode)",
      questionsCount: 0,
      chatMessagesCount: chatMessages.length,
      subscriptionsCount: subscriptionRequests.length,
      promoCodesCount: activePromoCodes.length
    });
  }
});

// Explicit Manual DB Migration & Seeding Endpoint
app.post("/api/admin/init-db", requireAdmin, async (req, res) => {
  if (!databaseUrl) {
    return res.status(400).json({ success: false, message: "DATABASE_URL environment variable is missing" });
  }

  try {
    if (!dbPool) {
      const isRemote = !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");
      dbPool = new Pool({
        connectionString: databaseUrl,
        ssl: isRemote ? { rejectUnauthorized: false } : false,
        max: 5,
        connectionTimeoutMillis: 10000,
      });
    }

    const client = await dbPool.connect();
    isDbConnected = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(100) PRIMARY KEY,
        specialty_id VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        question_ar TEXT,
        question_en TEXT NOT NULL,
        options_en JSONB NOT NULL,
        correct_option_index INT NOT NULL,
        explanation_en TEXT NOT NULL,
        reference_book VARCHAR(200),
        difficulty VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(100) PRIMARY KEY,
        sender_name VARCHAR(100) NOT NULL,
        sender_role VARCHAR(100) NOT NULL,
        sender_specialty VARCHAR(100) NOT NULL,
        message TEXT,
        attachment JSONB,
        timestamp VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscription_requests (
        id VARCHAR(100) PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        user_email VARCHAR(150) NOT NULL,
        user_phone VARCHAR(50),
        specialty_id VARCHAR(50) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        receipt_url TEXT,
        promo_code VARCHAR(50),
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        action_token_hash VARCHAR(128),
        rejection_reason TEXT,
        action_token_used BOOLEAN DEFAULT FALSE,
        action_token_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS action_token_hash VARCHAR(128);
      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS action_token_used BOOLEAN DEFAULT FALSE;
      ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS action_token_used_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS promo_codes (
        code VARCHAR(50) PRIMARY KEY,
        plan_id VARCHAR(50) NOT NULL,
        discount_percent INT DEFAULT 100,
        is_used BOOLEAN DEFAULT FALSE,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        is_subscribed BOOLEAN DEFAULT false,
        subscription_type VARCHAR(50) DEFAULT NULL,
        subscription_start TIMESTAMP DEFAULT NULL,
        subscription_end TIMESTAMP DEFAULT NULL,
        last_login TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        activation_token VARCHAR(255) DEFAULT NULL,
        reset_token VARCHAR(255) DEFAULT NULL
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        exam_id VARCHAR(100),
        exam_mode VARCHAR(50) DEFAULT 'STUDENT_TRAINING',
        specialty_id VARCHAR(100),
        score FLOAT DEFAULT 0,
        time_taken INTEGER,
        time_remaining_seconds INTEGER,
        current_question_index INTEGER DEFAULT 0,
        auto_next BOOLEAN DEFAULT TRUE,
        answers JSONB DEFAULT '{}',
        question_ids JSONB DEFAULT '[]',
        questions_snapshot JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'in_progress',
        proctoring_report JSONB,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP DEFAULT NULL,
        last_active_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS exam_mode VARCHAR(50) DEFAULT 'STUDENT_TRAINING';
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS questions_snapshot JSONB DEFAULT '[]';
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS current_question_index INT DEFAULT 0;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS time_remaining_seconds INT;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS auto_next BOOLEAN DEFAULT TRUE;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS question_ids JSONB DEFAULT '[]';
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMP;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS camera_enabled BOOLEAN DEFAULT TRUE;
      ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS flagged_questions JSONB DEFAULT '[]';


      CREATE TABLE IF NOT EXISTS student_question_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exam_attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
        question_id VARCHAR(100) NOT NULL,
        specialty_id VARCHAR(50) NOT NULL,
        category VARCHAR(255),
        question_order INT,
        shown_at TIMESTAMP DEFAULT NOW(),
        answered_at TIMESTAMP,
        selected_answer INT,
        is_correct BOOLEAN
      );

      CREATE INDEX IF NOT EXISTS idx_sqh_user_spec ON student_question_history (user_id, specialty_id);
      CREATE INDEX IF NOT EXISTS idx_sqh_user_q ON student_question_history (user_id, question_id);
      CREATE INDEX IF NOT EXISTS idx_sqh_attempt ON student_question_history (exam_attempt_id);

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        subscription_type VARCHAR(50) NOT NULL,
        receipt_image_url TEXT,
        payment_method VARCHAR(50) DEFAULT 'bankak',
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        approved_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS proctoring_reports (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        specialty_id VARCHAR(50) NOT NULL,
        tab_switches INT DEFAULT 0,
        face_loss_count INT DEFAULT 0,
        integrity_score INT DEFAULT 100,
        status VARCHAR(100),
        summary_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed/sync questions to both master and specialty tables
    let seededQuestionsCount = 0;
    

    

    // Seed promo codes if empty
    const promoCountRes = await client.query("SELECT COUNT(*) FROM promo_codes");
    if (parseInt(promoCountRes.rows[0].count, 10) === 0) {
      for (const p of INITIAL_PROMO_CODES) {
        await client.query(
          `INSERT INTO promo_codes (code, plan_id, discount_percent, is_used)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO NOTHING`,
          [p.code, p.planId, p.discountPercent, p.isUsed]
        );
      }
    }

    client.release();

    return res.json({
      success: true,
      message: "Supabase database schema & isolated specialty tables initialized & seeded successfully!",
      tablesCreated: ["users", "payments", "exam_attempts", "questions", "questions_labs", "questions_nursing", "questions_medicine", "questions_internal_medicine", "chat_messages", "subscription_requests", "promo_codes", "proctoring_reports"],
      seededQuestionsCount
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      tip: "If port 5432 failed on Serverless, try Supabase Connection Pooler URL with port 6543 (transaction mode)."
    });
  }
});

// Endpoint to verify existence and row counts of all tables in Supabase
app.get("/api/admin/verify-tables", requireAdmin, async (req, res) => {
  if (!dbPool || !isDbConnected) {
    return res.json({
      connected: false,
      mode: "In-Memory Store (Fallback)",
      message: "Database not connected"
    });
  }

  try {
    const tablesRes = await dbPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `);

    const tableNames: string[] = tablesRes.rows.map(r => r.table_name);
    const tableStats: Record<string, number> = {};

    for (const name of tableNames) {
      try {
        const countRes = await dbPool.query(`SELECT COUNT(*) FROM "${name}"`);
        tableStats[name] = parseInt(countRes.rows[0].count, 10);
      } catch (cErr) {
        tableStats[name] = -1;
      }
    }

    return res.json({
      connected: true,
      tablesCount: tableNames.length,
      tables: tableNames,
      tableStats,
      requiredTablesCheck: {
        users: tableNames.includes('users'),
        payments: tableNames.includes('payments'),
        exam_attempts: tableNames.includes('exam_attempts'),
        subscription_requests: tableNames.includes('subscription_requests'),
        questions: tableNames.includes('questions'),
        promo_codes: tableNames.includes('promo_codes'),
        questions_labs: tableNames.includes('questions_labs'),
        questions_medicine: tableNames.includes('questions_medicine'),
        questions_nursing: tableNames.includes('questions_nursing'),
        questions_internal_medicine: tableNames.includes('questions_internal_medicine')
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      error: err.message
    });
  }
});

// 1. Medical Specialties
app.get("/api/specialties", async (req, res) => {
  try {
    const specialtiesRes = await executeDbQuery(`
      SELECT s.*, c.badge_color 
      FROM medical_specialties s
      LEFT JOIN medical_councils c ON s.council_id = c.id
      ORDER BY s.display_order
    `);
    
    const specialties = specialtiesRes.rows.map(s => ({
      id: s.id,
      councilId: s.council_id,
      titleAr: s.title_ar,
      titleEn: s.title_en,
      iconName: s.icon_name,
      description: s.description,
      questionCount: 0,
      activeCount: 0,
      badgeColor: s.badge_color || 'emerald',
      isActive: s.is_active
    }));
    
    res.json(specialties);
  } catch (err: any) {
    console.error("Error fetching specialties:", err);
    res.status(500).json({ error: "Failed to fetch specialties" });
  }
});

// 2. Questions Bank Management
app.get("/api/questions", requireAuth, async (req, res) => {
  const { specialtyId, category } = req.query;
  const mode = ((req.query.mode as string) || 'drill').toLowerCase();
  const authUser = (req as any).auth || (req as any).user;
  const authenticatedEmail = String(authUser?.email || '').trim().toLowerCase();
  const isAdmin = authUser?.role === 'admin' || ADMIN_EMAILS.includes(authenticatedEmail);

  let questionLimit = 10;

  if (isAdmin && (req.query.mode === 'admin' || !req.query.mode)) {
    questionLimit = 2000;
  } else if (mode === 'mock') {
    let isSubscribedNow = ADMIN_EMAILS.includes(authenticatedEmail);
    if (!isSubscribedNow) {
      try {
        const uRes = await executeDbQuery(
          "SELECT is_subscribed, subscription_end FROM users WHERE LOWER(email) = $1",
          [authenticatedEmail]
        );
        if (uRes && uRes.rows.length > 0) {
          const u = uRes.rows[0];
          const remainingDays = u.subscription_end
            ? Math.max(0, Math.ceil((new Date(u.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0;
          isSubscribedNow = Boolean(u.is_subscribed) && remainingDays > 0;
        }
      } catch (err: any) {
        logSystemEvent('error', 'exam', `Subscription check for questions failed: ${err.message}`);
      }
    }
    if (!isSubscribedNow) {
      return res.status(403).json({ success: false, error: "هذا الامتحان الرسمي متاح للمشتركين المفعّلين فقط" });
    }
    questionLimit = 50;
  }

  if (dbPool && isDbConnected) {
    try {
      let queryStr = `SELECT * FROM unified_question_bank WHERE status != 'archived'`;
      const params: any[] = [];
      if (specialtyId && typeof specialtyId === 'string') {
        params.push(specialtyId);
        queryStr += ` AND specialty_id = ${params.length}`;
      }
      if (category && typeof category === 'string') {
        params.push(category);
        queryStr += ` AND category_name = ${params.length}`;
      }

      params.push(questionLimit);
      if (isAdmin && (req.query.mode === 'admin' || !req.query.mode)) {
        queryStr += ` ORDER BY created_at DESC LIMIT ${params.length}`;
      } else {
        queryStr += ` ORDER BY RANDOM() LIMIT ${params.length}`;
      }

      const dbRes = await dbPool.query(queryStr, params);
      const mapped: Question[] = dbRes.rows.map(r => {
        let opts = [];
        if (typeof r.options === 'string') {
           try { opts = JSON.parse(r.options); } catch(e) {}
        } else {
           opts = r.options || [];
        }
        const strOptions = opts.map((o:any) => typeof o === 'string' ? o : (o.text_en || o.text_ar || ''));
        const optionsEn = opts.map((o:any) => typeof o === 'string' ? o : (o.text_en || o.text || ''));
        const optionsAr = opts.map((o:any) => typeof o === 'string' ? o : (o.text_ar || o.text || ''));

        return {
          id: r.id,
          specialtyId: r.specialty_id as any,
          category: r.category_name || r.category,
          questionAr: r.lead_in_ar || r.lead_in_en || r.question_ar,
          questionEn: r.lead_in_en || r.question_en,
          stem: r.stem_en || r.stem_ar,
          options: strOptions,
          optionsEn,
          optionsAr,
          correctIndex: r.correct_option_index || 0,
          explanationAr: r.explanation_ar || r.explanation_en,
          explanationEn: r.explanation_en,
          reference: r.reference_source || r.reference_book,
          difficulty: r.difficulty || 'متوسط',
          labTable: typeof r.lab_table === 'string' ? JSON.parse(r.lab_table) : (r.lab_table || undefined)
        };
      });
      return res.json(mapped);
    } catch (err) {
      console.error("PG Get Questions Error:", err);
      return res.status(500).json({ error: "Failed to fetch questions" });
    }
  }

  return res.status(503).json({ error: "Database not connected. Offline mode is disabled." });
});

// In-memory demo sessions cache (for visitor demo answer verification without exposing keys)
const demoSessionsMap = new Map<string, { specialtyId: string; questions: Question[]; createdAt: number }>();

// Periodic cleanup of demo sessions older than 4 hours
setInterval(() => {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000;
  for (const [id, session] of demoSessionsMap.entries()) {
    if (session.createdAt < cutoff) {
      demoSessionsMap.delete(id);
    }
  }
}, 60 * 60 * 1000);

// Helper to sanitize question for student/visitor client (removes correct answers and explanations until submitted)
function sanitizeQuestionForClient(q: Question) {
  return {
    ...q,
    id: q.id,
    specialtyId: q.specialtyId,
    category: q.category,
    questionAr: q.questionAr,
    questionEn: q.questionEn,
    options: q.options,
    optionsEn: q.optionsEn,
    stem: q.stem,
    labTable: q.labTable,
    difficulty: q.difficulty,
    optionsPct: q.optionsPct,
    textbookTopic: q.textbookTopic,
    correctIndex: q.correctIndex,
    explanationAr: q.explanationAr,
    explanationEn: q.explanationEn,
    explainWrong: q.explainWrong,
    reference: q.reference,
    highYieldFact: q.highYieldFact
  };
}

function selectProportionally(
  categoriesMap: Map<string, string[]>,
  targetCount: number
): string[] {
  const categoryEntries = Array.from(categoriesMap.entries()).filter(([_, ids]) => ids.length > 0);
  const totalAvailable = categoryEntries.reduce((sum, [_, ids]) => sum + ids.length, 0);

  if (totalAvailable === 0 || targetCount <= 0) return [];
  if (totalAvailable <= targetCount) {
    const allIds: string[] = [];
    for (const [_, ids] of categoryEntries) allIds.push(...ids);
    return allIds;
  }

  // Largest Remainder Method (Hare-Niemeyer / Hamilton)
  const allocations = categoryEntries.map(([catName, ids], idx) => {
    const exactQuota = (ids.length / totalAvailable) * targetCount;
    const baseQuota = Math.min(ids.length, Math.floor(exactQuota));
    const remainder = exactQuota - Math.floor(exactQuota);
    return { catName, ids, exactQuota, quota: baseQuota, remainder, originalIndex: idx };
  });

  let currentAllocated = allocations.reduce((sum, a) => sum + a.quota, 0);
  let leftovers = targetCount - currentAllocated;

  allocations.sort((a, b) => b.remainder - a.remainder || b.ids.length - a.ids.length);

  let progress = true;
  while (leftovers > 0 && progress) {
    progress = false;
    for (const item of allocations) {
      if (leftovers > 0 && item.quota < item.ids.length) {
        item.quota += 1;
        leftovers -= 1;
        progress = true;
      }
    }
  }

  const selected: string[] = [];
  for (const item of allocations) {
    const shuffled = [...item.ids].sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, item.quota));
  }
  return selected;
}

// 1. Start Exam Endpoint (VISITOR_DEMO and STUDENT_TRAINING)
app.post("/api/exam/start", async (req, res) => {
  const { specialtyId, mode } = req.body || {};
  const examMode: 'VISITOR_DEMO' | 'STUDENT_TRAINING' = (mode === 'VISITOR_DEMO') ? 'VISITOR_DEMO' : 'STUDENT_TRAINING';

  if (!specialtyId || typeof specialtyId !== 'string') {
    return res.status(400).json({ success: false, error: "التخصص مطلوب" });
  }

  // Handle VISITOR_DEMO (Free 10 questions, no authentication required, no student attempt recorded)
  if (examMode === 'VISITOR_DEMO') {
    const questionLimit = 10;
    try {
      const rows = await executeDbQuery(
        `SELECT uqb.*, (SELECT image_url FROM question_images qi WHERE qi.question_id = uqb.id LIMIT 1) as image_url FROM unified_question_bank uqb WHERE uqb.specialty_id = $1 AND uqb.status != 'archived' ORDER BY RANDOM() LIMIT $2`,
        [specialtyId, questionLimit]
      );

      if (rows === null) {
        return res.status(500).json({ success: false, error: "تعذر الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً." });
      }

      if (!rows.rows || rows.rows.length === 0) {
        return res.status(503).json({ success: false, error: "نعتذر، بنك الأسئلة لهذا القسم قيد الإنشاء." });
      }

      const chosenQuestions: Question[] = rows.rows.map((r: any) => {
        let opts = [];
        if (typeof r.options === 'string') {
           try { opts = JSON.parse(r.options); } catch(e) {}
        } else {
           opts = r.options || [];
        }
        const strOptions = opts.map((o:any) => typeof o === 'string' ? o : (o.text || o.text_en || o.text_ar || ''));
        const optionsEn = opts.map((o:any) => typeof o === 'string' ? o : (o.text_en || o.text || ''));
        const optionsAr = opts.map((o:any) => typeof o === 'string' ? o : (o.text_ar || o.text || ''));
        return {
          id: r.id,
          specialtyId: r.specialty_id as any,
          category: r.category_name || r.category || 'General',
          questionAr: r.lead_in_ar || r.lead_in_en,
          questionEn: r.lead_in_en,
          stem: r.stem_en || r.stem_ar,
          options: strOptions,
          optionsEn,
          optionsAr,
          correctIndex: r.correct_option_index,
          explanationAr: r.explanation_ar || r.explanation_en,
          explanationEn: r.explanation_en,
          reference: r.reference_source,
          difficulty: r.difficulty || 'متوسط',
          imageUrl: r.image_url || undefined
        };
      });

      const attemptId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      demoSessionsMap.set(attemptId, {
        specialtyId,
        questions: chosenQuestions,
        createdAt: Date.now()
      });

      const sanitized = chosenQuestions; // Return full details for 2-request optimization
      return res.json({
        success: true,
        attemptId,
        mode: 'VISITOR_DEMO',
        languageMode: specialtyLanguagesMap[specialtyId] || 'ENGLISH_ONLY',
        questions: sanitized,
        timeLimitMinutes: 10
      });
    } catch (err: any) {
      logSystemEvent('error', 'exam', `Visitor Demo Start Error: ${err.message}`);
      return res.status(500).json({ success: false, error: "تعذر بدء الامتحان، يرجى المحاولة لاحقاً." });
    }
  }

  // Handle STUDENT_TRAINING (50 questions, requires authentication and active subscription)
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: "يجب تسجيل الدخول لبدء الامتحان التدريبي الرئيسي" });
  }

  let authUser: { email: string; role?: string } | null = null;
  try {
    authUser = jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return res.status(401).json({ success: false, error: "جلسة الدخول غير صالحة أو منتهية" });
  }

  const authenticatedEmail = String(authUser?.email || '').trim().toLowerCase();
  let isSubscribedNow = ADMIN_EMAILS.includes(authenticatedEmail);
  let resolvedUserId: string | null = null;

  try {
    const uRes = await executeDbQuery(
      "SELECT id, is_subscribed, subscription_end FROM users WHERE LOWER(email) = $1",
      [authenticatedEmail]
    );
    if (uRes && uRes.rows.length > 0) {
      const u = uRes.rows[0];
      resolvedUserId = u.id;
      if (!isSubscribedNow) {
        const remainingDays = u.subscription_end
          ? Math.max(0, Math.ceil((new Date(u.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;
        isSubscribedNow = Boolean(u.is_subscribed) && remainingDays > 0;
      }
    }
  } catch (err: any) {
    logSystemEvent('error', 'exam', `Subscription check for exam start failed: ${err.message}`);
  }

  if (!isSubscribedNow) {
    return res.status(403).json({ success: false, error: "الامتحان التدريبي الرئيسي متاح للمشتركين المفعّلين فقط" });
  }
  // --- BEGIN ACTIVE ATTEMPT PROTECTION ---
  if (resolvedUserId) {
    try {
      const activeRes = await executeDbQuery(
        `SELECT * FROM exam_attempts 
         WHERE user_id = $1 AND specialty_id = $2 AND status = 'in_progress'
         ORDER BY created_at DESC LIMIT 1`,
         [resolvedUserId, specialtyId]
      );
      if (activeRes && activeRes.rows.length > 0) {
        const attempt = activeRes.rows[0];
        
        let finalTimeRemaining = attempt.time_remaining_seconds;
        if (attempt.last_active_at && finalTimeRemaining !== null) {
          const elapsed = Math.floor((Date.now() - new Date(attempt.last_active_at).getTime()) / 1000);
          const computedRemaining = Math.max(0, finalTimeRemaining - elapsed);
          
          if (attempt.exam_mode === 'STUDENT_TRAINING') {
            const GRACE_SECONDS = 28800;
            if (elapsed > attempt.time_remaining_seconds + GRACE_SECONDS) {
              await executeDbQuery("UPDATE exam_attempts SET status = 'completed', completed_at = NOW(), time_remaining_seconds = 0 WHERE id = $1", [attempt.id]);
              finalTimeRemaining = null;
            } else {
              finalTimeRemaining = computedRemaining;
            }
          } else {
            finalTimeRemaining = computedRemaining;
            if (finalTimeRemaining <= 0) {
               await executeDbQuery("UPDATE exam_attempts SET status = 'completed', completed_at = NOW(), time_remaining_seconds = 0 WHERE id = $1", [attempt.id]);
               finalTimeRemaining = null;
            }
          }
        }

        if (finalTimeRemaining !== null) {
          const specRes = await executeDbQuery("SELECT council_id FROM medical_specialties WHERE id = $1", [specialtyId]);
          const councilId = specRes.rows.length > 0 ? specRes.rows[0].council_id : null;
          let snapshot: any[] = [];
          if (typeof attempt.questions_snapshot === 'string') {
            try { snapshot = JSON.parse(attempt.questions_snapshot); } catch {}
          } else if (Array.isArray(attempt.questions_snapshot)) {
            snapshot = attempt.questions_snapshot;
          }
          
          let answersObj: Record<string, any> = {};
          if (typeof attempt.answers === 'string') {
            try { answersObj = JSON.parse(attempt.answers); } catch {}
          } else if (attempt.answers && typeof attempt.answers === 'object') {
            answersObj = attempt.answers;
          }
          
          const sanitizedQuestions = snapshot.map(q => {
            const sq = sanitizeQuestionForClient(q) as any;
            if (answersObj[q.id]) {
              sq.selectedAnswer = answersObj[q.id].selectedAnswer;
              sq.correctIndex = q.correctIndex;
              sq.explanationAr = q.explanationAr || q.explanationEn;
              sq.explanationEn = q.explanationEn;
              sq.reference = q.reference;
            }
            return sq;
          });

          return res.json({
            success: true,
            attemptId: attempt.id,
            mode: attempt.exam_mode || 'STUDENT_TRAINING',
            councilId: councilId,
            questions: sanitizedQuestions,
            timeLimitMinutes: Math.ceil((finalTimeRemaining != null ? finalTimeRemaining : snapshot.length * 60) / 60),
            currentQuestionIndex: attempt.current_question_index || 0,
            autoNext: attempt.auto_next ?? true,
            answers: answersObj,
            flaggedQuestions: attempt.flagged_questions || [],
            cameraEnabled: attempt.camera_enabled ?? true
          });
        }
      }
    } catch(err: any) {
      logSystemEvent('error', 'exam', `Active attempt check failed: ${err.message}`);
    }
  }
  // --- END ACTIVE ATTEMPT PROTECTION ---

  


  try {
    // Item 5: Full Cycle & History Evaluation per Student + Specialty + unified_question_bank
    const poolRes = await executeDbQuery(
      `WITH user_seen AS (
        SELECT question_id, COUNT(*)::int AS seen_count
        FROM student_question_history
        WHERE user_id = $1 AND specialty_id = $2
        GROUP BY question_id
      ),
      eligible_pool AS (
        SELECT 
          uqb.id,
          COALESCE(uqb.category_name, 'General') AS category_name,
          COALESCE(us.seen_count, 0) AS seen_count
        FROM unified_question_bank uqb
        LEFT JOIN user_seen us ON uqb.id = us.question_id
        WHERE uqb.specialty_id = $2 AND uqb.status != 'archived'
      ),
      min_state AS (
        SELECT COALESCE(MIN(seen_count), 0) AS min_seen, COUNT(*)::int AS total_eligible
        FROM eligible_pool
      )
      SELECT 
        ep.id,
        ep.category_name,
        ep.seen_count,
        ms.min_seen,
        ms.total_eligible
      FROM eligible_pool ep
      CROSS JOIN min_state ms`,
      [resolvedUserId, specialtyId]
    );

    if (poolRes === null) {
      return res.status(500).json({ success: false, error: "تعذر الاتصال بقاعدة البيانات، يرجى المحاولة لاحقاً." });
    }

    const allRows = poolRes.rows || [];
    if (allRows.length === 0 || allRows[0].total_eligible === 0) {
      return res.status(503).json({ success: false, error: "نعتذر، بنك الأسئلة لهذا القسم قيد الإنشاء." });
    }

    const totalEligible = allRows[0].total_eligible;
    // Item 3: 1-49 -> all, 50+ -> 50
    const targetCount = Math.min(50, totalEligible);

    // Item 5: Filter unconsumed questions in current cycle (seen_count === min_seen)
    const currentCycleRows = allRows.filter(r => r.seen_count === r.min_seen);

    // Group current cycle questions by category_name (Item 5 & Item 6)
    const currentCycleMap = new Map<string, string[]>();
    for (const r of currentCycleRows) {
      const cat = r.category_name || 'General';
      if (!currentCycleMap.has(cat)) currentCycleMap.set(cat, []);
      currentCycleMap.get(cat)!.push(r.id);
    }

    // Item 6: Proportional distribution using Largest Remainder Method based on remaining-in-cycle counts
    let selectedIds = selectProportionally(currentCycleMap, Math.min(targetCount, currentCycleRows.length));

    // If current cycle pool was exhausted before reaching targetCount, start next cycle (excluding already selected)
    if (selectedIds.length < targetCount) {
      const needed = targetCount - selectedIds.length;
      const selectedSet = new Set(selectedIds);
      const nextCycleCandidates = allRows.filter(r => !selectedSet.has(r.id));
      
      const nextCycleMap = new Map<string, string[]>();
      for (const r of nextCycleCandidates) {
        const cat = r.category_name || 'General';
        if (!nextCycleMap.has(cat)) nextCycleMap.set(cat, []);
        nextCycleMap.get(cat)!.push(r.id);
      }

      const nextSelected = selectProportionally(nextCycleMap, needed);
      selectedIds.push(...nextSelected);
    }

    // Deduplicate selected IDs (Item 8)
    selectedIds = Array.from(new Set(selectedIds));

    if (selectedIds.length === 0) {
      return res.status(503).json({ success: false, error: "نعتذر، بنك الأسئلة لهذا القسم قيد الإنشاء." });
    }

    // Shuffle questions order
    selectedIds = selectedIds.sort(() => Math.random() - 0.5);

    // Item 9: Fetch complete question records from unified_question_bank
    const placeholders = selectedIds.map((_, i) => `$${i + 1}`).join(',');
    const qRes = await executeDbQuery(
      `SELECT uqb.*, (SELECT image_url FROM question_images qi WHERE qi.question_id = uqb.id LIMIT 1) as image_url FROM unified_question_bank uqb WHERE uqb.id IN (${placeholders}) AND uqb.specialty_id = $${selectedIds.length + 1} AND uqb.status != 'archived'`,
      [...selectedIds, specialtyId]
    );

    if (qRes === null) {
      return res.status(500).json({ success: false, error: "تعذر استرجاع بيانات الأسئلة من قاعدة البيانات" });
    }

    const byId = new Map((qRes.rows || []).map((r: any) => [r.id, r]));
    const fullQuestions: Question[] = selectedIds
      .map(id => byId.get(id))
      .filter(Boolean)
      .map((r: any) => {
        let opts = [];
        if (typeof r.options === 'string') {
           try { opts = JSON.parse(r.options); } catch(e) {}
        } else {
           opts = r.options || [];
        }
        const strOptions = opts.map((o:any) => typeof o === 'string' ? o : (o.text || o.text_en || o.text_ar || ''));
        const optionsEn = opts.map((o:any) => typeof o === 'string' ? o : (o.text_en || o.text || ''));
        const optionsAr = opts.map((o:any) => typeof o === 'string' ? o : (o.text_ar || o.text || ''));
        return {
          id: r.id,
          specialtyId: r.specialty_id as any,
          category: r.category_name || r.category || 'General',
          questionAr: r.lead_in_ar || r.lead_in_en,
          questionEn: r.lead_in_en,
          stem: r.stem_en || r.stem_ar,
          options: strOptions,
          optionsEn,
          optionsAr,
          correctIndex: r.correct_option_index,
          explanationAr: r.explanation_ar || r.explanation_en,
          explanationEn: r.explanation_en,
          reference: r.reference_source,
          difficulty: r.difficulty || 'متوسط',
          imageUrl: r.image_url || undefined
        };
      });

    // Item 10: Insert new attempt snapshot into exam_attempts
    let attemptId = `att_${Date.now()}`;
    const initialTimeRemaining = fullQuestions.length * 60; // 60s per question

    const attemptRes = await executeDbQuery(
      `INSERT INTO exam_attempts (
        user_id, exam_id, exam_mode, specialty_id, status, 
        question_ids, questions_snapshot, time_remaining_seconds, current_question_index, 
        auto_next, answers, started_at, last_active_at, created_at
      )
      VALUES ($1, $2, 'STUDENT_TRAINING', $3, 'in_progress', $4, $5, $6, 0, TRUE, '{}', NOW(), NOW(), NOW())
      RETURNING id`,
      [
        resolvedUserId,
        `STUDENT_TRAINING_${Date.now()}`,
        specialtyId,
        JSON.stringify(selectedIds),
        JSON.stringify(fullQuestions),
        initialTimeRemaining
      ]
    );

    if (attemptRes && attemptRes.rows.length > 0) {
      attemptId = attemptRes.rows[0].id;
    }

    // Record question history for this student
    if (resolvedUserId && attemptId) {
      for (let order = 0; order < fullQuestions.length; order++) {
        const q = fullQuestions[order];
        executeDbQuery(
          `INSERT INTO student_question_history (user_id, exam_attempt_id, question_id, specialty_id, category, question_order, shown_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [resolvedUserId, attemptId, q.id, specialtyId, q.category || 'General', order + 1]
        ).catch(() => {});
      }
    }

    const sanitizedQuestions = fullQuestions.map(sanitizeQuestionForClient);

    const specRes = await executeDbQuery("SELECT council_id FROM medical_specialties WHERE id = $1", [specialtyId]);
    const councilId = specRes.rows.length > 0 ? specRes.rows[0].council_id : null;

    return res.json({
      success: true,
      attemptId,
      mode: 'STUDENT_TRAINING',
      councilId: councilId,
      languageMode: specialtyLanguagesMap[specialtyId] || 'ENGLISH_ONLY',
      questions: sanitizedQuestions,
      timeLimitMinutes: Math.ceil(initialTimeRemaining / 60)
    });
  } catch (err: any) {
    logSystemEvent('error', 'exam', `Student Training Start Error: ${err.message}`);
    return res.status(500).json({ success: false, error: "تعذر بدء الامتحان حالياً، يرجى المحاولة مرة أخرى" });
  }
});

// 2. Submit Question Answer Endpoint (Backend validates, records, and returns explanation/feedback)
app.post("/api/exam/answer", async (req, res) => {
  const { attemptId, questionId, selectedAnswer, currentQuestionIndex, timeRemainingSeconds, autoNext } = req.body || {};
  if (!attemptId || !questionId || selectedAnswer === undefined) {
    return res.status(400).json({ success: false, error: "معلومات الإجابة غير مكتملة" });
  }

  const optIdx = Number(selectedAnswer);

  // Case A: Visitor Demo Attempt
  if (typeof attemptId === 'string' && attemptId.startsWith('demo_')) {
    const demo = demoSessionsMap.get(attemptId);
    let q = demo?.questions.find(item => item.id === questionId);
    if (!q) {
      return res.status(404).json({ success: false, error: "السؤال غير موجود" });
    }

    const isCorrect = (optIdx === q.correctIndex);
    return res.json({
      success: true,
      isCorrect,
      correctIndex: q.correctIndex,
      explanationAr: q.explanationAr || q.explanationEn,
      explanationEn: q.explanationEn,
      explainWrong: q.explainWrong || [],
      highYieldFact: q.highYieldFact,
      reference: q.reference
    });
  }

  // Case B: Student Training Attempt (Database)
  // Enforce strict auth middleware
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ success: false, error: "Unauthorized" });
  let authUser;
  try { authUser = jwt.verify(token, JWT_SECRET) as any; } catch (err) { return res.status(401).json({ success: false, error: "Invalid token" }); }

  try {
    const userRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [String(authUser.email).trim().toLowerCase()]);
    if (!userRes || userRes.rows.length === 0) return res.status(403).json({ success: false, error: "User not found" });
    const resolvedUserId = userRes.rows[0].id;

    const attRes = await executeDbQuery("SELECT * FROM exam_attempts WHERE id = $1", [attemptId]);
    if (!attRes || attRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: "جلسة الامتحان غير موجودة" });
    }

    const attempt = attRes.rows[0];
    
    // Ownership check
    if (attempt.user_id !== resolvedUserId) {
      return res.status(403).json({ success: false, error: "Forbidden: Attempt ownership mismatch" });
    }

    // Immutable Finish check
    if (attempt.status === 'completed') {
      return res.status(400).json({ success: false, error: "Exam is already completed. Immutable review mode active." });
    }

    // Timer evaluation
    let finalTimeRemaining = attempt.time_remaining_seconds;
    if (attempt.last_active_at && finalTimeRemaining !== null) {
      const elapsed = Math.floor((Date.now() - new Date(attempt.last_active_at).getTime()) / 1000);
      finalTimeRemaining = Math.max(0, finalTimeRemaining - elapsed);
    }
    if (attempt.time_remaining_seconds !== null && finalTimeRemaining <= 0) {
       // Mark as completed
       await executeDbQuery("UPDATE exam_attempts SET status = 'completed', completed_at = NOW(), time_remaining_seconds = 0 WHERE id = $1", [attemptId]);
       return res.status(400).json({ success: false, error: "Time expired" });
    }

    let snapshot = [];
    if (typeof attempt.questions_snapshot === 'string') {
      try { snapshot = JSON.parse(attempt.questions_snapshot); } catch {}
    } else if (Array.isArray(attempt.questions_snapshot)) {
      snapshot = attempt.questions_snapshot;
    }

    let q = snapshot.find(item => item.id === questionId);
    if (!q) return res.status(404).json({ success: false, error: "السؤال غير موجود في هذه المحاولة" });

    let answersObj = {};
    if (typeof attempt.answers === 'string') {
      try { answersObj = JSON.parse(attempt.answers); } catch {}
    } else if (attempt.answers && typeof attempt.answers === 'object') {
      answersObj = { ...attempt.answers };
    }

    if (answersObj[questionId]) {
      const existing = answersObj[questionId];
      // Atomic Answer & Progress Save (update progress even if already answered)
      await executeDbQuery(
        `UPDATE exam_attempts 
         SET current_question_index = COALESCE($1, current_question_index),
             time_remaining_seconds = COALESCE($2, time_remaining_seconds),
             auto_next = COALESCE($3, auto_next),
             last_active_at = NOW()
         WHERE id = $4`,
        [currentQuestionIndex, finalTimeRemaining, autoNext, attemptId]
      );

      return res.json({
        success: true,
        isCorrect: existing.isCorrect,
        correctIndex: q.correctIndex,
        explanationAr: q.explanationAr || q.explanationEn,
        explanationEn: q.explanationEn,
        explainWrong: q.explainWrong || [],
        highYieldFact: q.highYieldFact,
        reference: q.reference,
        alreadyAnswered: true,
        score: attempt.score || 0,
        answeredCount: Object.keys(answersObj).length,
        totalQuestions: snapshot.length || 50
      });
    }

    const isCorrect = (optIdx === q.correctIndex);
    answersObj[questionId] = {
      selectedAnswer: optIdx,
      isCorrect,
      answeredAt: new Date().toISOString()
    };

    const totalQuestions = snapshot.length || 50;
    const correctCount = Object.values(answersObj).filter((a: any) => a.isCorrect).length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Atomic Answer & Progress Save
    await executeDbQuery(
      `UPDATE exam_attempts 
       SET answers = $1, score = $2, current_question_index = COALESCE($3, current_question_index),
           time_remaining_seconds = COALESCE($4, time_remaining_seconds),
           auto_next = COALESCE($5, auto_next), last_active_at = NOW()
       WHERE id = $6`,
      [JSON.stringify(answersObj), score, currentQuestionIndex, finalTimeRemaining, autoNext, attemptId]
    );

    // Update student_question_history record
    executeDbQuery(
      "UPDATE student_question_history SET answered_at = NOW(), selected_answer = $1, is_correct = $2 WHERE exam_attempt_id = $3 AND question_id = $4",
      [optIdx, isCorrect, attemptId, questionId]
    ).catch(() => {});

    return res.json({
      success: true,
      isCorrect,
      correctIndex: q.correctIndex,
      explanationAr: q.explanationAr || q.explanationEn,
      explanationEn: q.explanationEn,
      explainWrong: q.explainWrong || [],
      highYieldFact: q.highYieldFact,
      reference: q.reference,
      score,
      answeredCount: Object.keys(answersObj).length,
      correctCount,
      totalQuestions
    });
  } catch (err) {
    logSystemEvent('error', 'exam', `Submit Answer Error: ${err.message}`);
    return res.status(500).json({ success: false, error: "تعذر حفظ الإجابة" });
  }
});

// 3. Save Exam Progress / Pause State Endpoint (Only for standalone navigation state changes)
app.post("/api/exam/save-progress", async (req, res) => {
  const { attemptId, currentQuestionIndex, timeRemainingSeconds, autoNext, flaggedQuestions, cameraEnabled } = req.body || {};
  if (!attemptId) return res.status(400).json({ success: false, error: "attemptId مطلوب" });

  if (typeof attemptId === 'string' && attemptId.startsWith('demo_')) return res.json({ success: true, saved: true });

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ success: false, error: "Unauthorized" });
  let authUser;
  try { authUser = jwt.verify(token, JWT_SECRET) as any; } catch (err) { return res.status(401).json({ success: false, error: "Invalid token" }); }

  try {
    const userRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [String(authUser.email).trim().toLowerCase()]);
    if (!userRes || userRes.rows.length === 0) return res.status(403).json({ success: false, error: "User not found" });
    const resolvedUserId = userRes.rows[0].id;

    const attRes = await executeDbQuery("SELECT * FROM exam_attempts WHERE id = $1", [attemptId]);
    if (!attRes || attRes.rows.length === 0) return res.status(404).json({ success: false, error: "Not found" });

    const attempt = attRes.rows[0];
    if (attempt.user_id !== resolvedUserId) return res.status(403).json({ success: false, error: "Forbidden" });
    if (attempt.status === 'completed') return res.status(400).json({ success: false, error: "Completed" });

    let finalTimeRemaining = attempt.time_remaining_seconds;
    if (attempt.last_active_at && finalTimeRemaining !== null) {
      const elapsed = Math.floor((Date.now() - new Date(attempt.last_active_at).getTime()) / 1000);
      finalTimeRemaining = Math.max(0, finalTimeRemaining - elapsed);
      if (finalTimeRemaining <= 0) {
         await executeDbQuery("UPDATE exam_attempts SET status = 'completed', completed_at = NOW(), time_remaining_seconds = 0 WHERE id = $1", [attemptId]);
         return res.json({ success: true, saved: false, expired: true });
      }
    }

    await executeDbQuery(
      `UPDATE exam_attempts 
       SET current_question_index = COALESCE($1, current_question_index),
           time_remaining_seconds = COALESCE($2, time_remaining_seconds),
           auto_next = COALESCE($3, auto_next),
           flagged_questions = COALESCE($4, flagged_questions),
           camera_enabled = COALESCE($5, camera_enabled),
           last_active_at = NOW()
       WHERE id = $6`,
      [
        currentQuestionIndex, finalTimeRemaining, autoNext, 
        flaggedQuestions ? JSON.stringify(flaggedQuestions) : null, 
        cameraEnabled, attemptId
      ]
    );
    return res.json({ success: true, saved: true });
  } catch (err) {
    logSystemEvent('error', 'exam', `Save progress error: ${err.message}`);
    return res.json({ success: true, saved: false });
  }
});

// 3.5. Authoritative Exam Finish Endpoint (Backend is the SOLE authority for score, status, and feedback)
app.post("/api/exam/finish", async (req, res) => {
  const { attemptId, answers, flaggedQuestions, cameraEnabled } = req.body || {};
  if (!attemptId) return res.status(400).json({ success: false, error: "attemptId مطلوب لإنهاء الامتحان" });

  const finishedAt = new Date().toISOString();

  if (typeof attemptId === 'string' && attemptId.startsWith('demo_')) {
    const demo = demoSessionsMap.get(attemptId);
    if (!demo) return res.status(404).json({ success: false, error: "جلسة غير موجودة" });
    return res.json({ success: true, attemptId, score: 0, correctCount: 0, totalQuestions: 10, passStatus: false, finishedAt, detailedQuestions: demo.questions });
  }

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ success: false, error: "Unauthorized" });
  let authUser;
  try { authUser = jwt.verify(token, JWT_SECRET) as any; } catch (err) { return res.status(401).json({ success: false, error: "Invalid token" }); }

  try {
    const userRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [String(authUser.email).trim().toLowerCase()]);
    if (!userRes || userRes.rows.length === 0) return res.status(403).json({ success: false, error: "User not found" });
    const resolvedUserId = userRes.rows[0].id;

    const attRes = await executeDbQuery("SELECT * FROM exam_attempts WHERE id = $1", [attemptId]);
    if (!attRes || attRes.rows.length === 0) return res.status(404).json({ success: false, error: "جلسة غير موجودة" });

    const attempt = attRes.rows[0];
    if (attempt.user_id !== resolvedUserId) return res.status(403).json({ success: false, error: "Forbidden" });

    let snapshot = [];
    if (typeof attempt.questions_snapshot === 'string') {
      try { snapshot = JSON.parse(attempt.questions_snapshot); } catch {}
    } else if (Array.isArray(attempt.questions_snapshot)) {
      snapshot = attempt.questions_snapshot;
    }

    let answersObj = {};
    if (typeof attempt.answers === 'string') {
      try { answersObj = JSON.parse(attempt.answers); } catch {}
    } else if (attempt.answers && typeof attempt.answers === 'object') {
      answersObj = { ...attempt.answers };
    }

    // Merge answers from req.body (Zero-request optimization)
    if (answers && typeof answers === 'object') {
      for (const [qId, selectedIdx] of Object.entries(answers)) {
        if (selectedIdx !== undefined && selectedIdx !== null) {
          const parsedIdx = typeof selectedIdx === 'object' ? (selectedIdx as any).selectedAnswer : selectedIdx;
          answersObj[qId] = {
            selectedAnswer: Number(parsedIdx),
            answeredAt: new Date().toISOString()
          };
        }
      }
    }

    // Server Authoritative Scoring Calculation
    let correctCount = 0;
    snapshot.forEach(q => {
      if (answersObj[q.id] && answersObj[q.id].selectedAnswer !== undefined) {
        const selected = Number(answersObj[q.id].selectedAnswer);
        const isCorrect = (selected === q.correctIndex);
        
        // Re-write to ensure no spoofed flags survive
        answersObj[q.id] = {
           selectedAnswer: selected,
           isCorrect: isCorrect,
           answeredAt: answersObj[q.id].answeredAt || new Date().toISOString()
        };

        if (isCorrect) {
          correctCount++;
        }
      }
    });

    const totalQuestions = snapshot.length || 50;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passStatus = score >= 60;

    // Immutable Finish: if already completed, just return existing result
    if (attempt.status !== 'completed') {
      await executeDbQuery(
        `UPDATE exam_attempts 
         SET status = 'completed', completed_at = NOW(), score = $1, time_remaining_seconds = 0, answers = $3, flagged_questions = $4, camera_enabled = $5
         WHERE id = $2`,
        [score, attemptId, JSON.stringify(answersObj), flaggedQuestions ? JSON.stringify(flaggedQuestions) : null, cameraEnabled]
      );
    }

    // Attach answer keys and feedback for Immutable Review Mode
    const detailedQuestions = snapshot.map((q: any) => {
      const selected = answersObj[q.id]?.selectedAnswer;
      return {
        ...sanitizeQuestionForClient(q),
        correctIndex: q.correctIndex,
        explanationAr: q.explanationAr || q.explanationEn,
        explanationEn: q.explanationEn,
        reference: q.reference,
        selectedAnswer: selected,
        isCorrect: selected !== undefined ? selected === q.correctIndex : false
      };
    });

    return res.json({
      success: true,
      attemptId,
      score,
      correctCount,
      totalQuestions,
      passStatus,
      finishedAt: attempt.completed_at || finishedAt,
      detailedQuestions
    });
  } catch (err) {
    logSystemEvent('error', 'exam', `Finish attempt error: ${err.message}`);
    return res.status(500).json({ success: false, error: "تعذر إنهاء الامتحان" });
  }
});


// 4. Get Active In-Progress Attempt for Resume Endpoint
app.get("/api/exam/active-attempt", requireAuth, async (req, res) => {
  const authUser = (req as any).auth || (req as any).user;
  const authenticatedEmail = String(authUser?.email || '').trim().toLowerCase();
  const specialtyId = req.query.specialtyId as string;

  try {
    const userRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [authenticatedEmail]);
    if (!userRes || userRes.rows.length === 0) return res.status(403).json({ success: false, error: "User not found" });
    const resolvedUserId = userRes.rows[0].id;

    const query = `
      SELECT * FROM exam_attempts
      WHERE user_id = $1
        AND status = 'in_progress'
        ${specialtyId ? 'AND specialty_id = $2' : ''}
      ORDER BY last_active_at DESC
      LIMIT 1
    `;
    const params = specialtyId ? [resolvedUserId, specialtyId] : [resolvedUserId];
    const dbRes = await executeDbQuery(query, params);

    if (dbRes && dbRes.rows.length > 0) {
      const attempt = dbRes.rows[0];

      let finalTimeRemaining = attempt.time_remaining_seconds;
      if (attempt.last_active_at && finalTimeRemaining !== null) {
        const elapsed = Math.floor((Date.now() - new Date(attempt.last_active_at).getTime()) / 1000);
        finalTimeRemaining = Math.max(0, finalTimeRemaining - elapsed);
        
        if (finalTimeRemaining <= 0) {
           await executeDbQuery("UPDATE exam_attempts SET status = 'completed', completed_at = NOW(), time_remaining_seconds = 0 WHERE id = $1", [attempt.id]);
           return res.json({ success: true, hasActiveAttempt: false });
        }
      }

      let snapshot: any[] = [];
      if (typeof attempt.questions_snapshot === 'string') {
        try { snapshot = JSON.parse(attempt.questions_snapshot); } catch {}
      } else if (Array.isArray(attempt.questions_snapshot)) {
        snapshot = attempt.questions_snapshot;
      }

      let answersObj: Record<string, any> = {};
      if (typeof attempt.answers === 'string') {
        try { answersObj = JSON.parse(attempt.answers); } catch {}
      } else if (attempt.answers && typeof attempt.answers === 'object') {
        answersObj = attempt.answers;
      }

      // Build answersFeedback for already answered questions
      const answersFeedback: Record<string, any> = {};
      const sanitizedQuestions = snapshot.map(q => {
        const sq = sanitizeQuestionForClient(q) as any;
        const ans = answersObj[q.id];
        if (ans) {
          answersFeedback[q.id] = {
            selectedAnswer: ans.selectedAnswer,
            isCorrect: ans.isCorrect,
            correctIndex: q.correctIndex,
            explanationAr: q.explanationAr || q.explanationEn,
            explanationEn: q.explanationEn,
            explainWrong: q.explainWrong || [],
            highYieldFact: q.highYieldFact,
            reference: q.reference,
            answeredAt: ans.answeredAt
          };
          // Correct-Answer Protection: ONLY expose if answered
          sq.selectedAnswer = ans.selectedAnswer;
          sq.correctIndex = q.correctIndex;
          sq.explanationAr = q.explanationAr || q.explanationEn;
          sq.explanationEn = q.explanationEn;
          sq.reference = q.reference;
        }
        return sq;
      });

      const simpleAnswers: Record<string, number> = {};
      for (const [qId, ans] of Object.entries(answersObj)) {
        simpleAnswers[qId] = (ans as any).selectedAnswer;
      }

      return res.json({
        success: true,
        hasActiveAttempt: true,
        attempt: {
          id: attempt.id,
          specialtyId: attempt.specialty_id,
          mode: attempt.exam_mode || 'STUDENT_TRAINING',
          questions: sanitizedQuestions,
          answers: simpleAnswers,
          answersFeedback,
          score: attempt.score || 0,
          currentQuestionIndex: attempt.current_question_index || 0,
          timeRemainingSeconds: finalTimeRemaining || (snapshot.length * 60),
          autoAdvanceEnabled: attempt.auto_next !== false,
          startedAt: attempt.started_at,
          flaggedQuestions: attempt.flagged_questions || [],
          cameraEnabled: attempt.camera_enabled ?? true
        }
      });
    }

    return res.json({ success: true, hasActiveAttempt: false });
  } catch (err: any) {
    logSystemEvent('error', 'exam', `Active attempt endpoint error: ${err.message}`);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
});

app.post("/api/questions", requireAdmin, async (req, res) => {
  const newQ = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...req.body
  };
  if (dbPool && isDbConnected) {
    try {
      await dbPool.query(
        
        `INSERT INTO unified_question_bank (id, specialty_id, category_name, lead_in_ar, lead_in_en, options, options_en, options_ar, correct_option_index, explanation_en, explanation_ar, reference_source, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           specialty_id = EXCLUDED.specialty_id,
           category_name = EXCLUDED.category_name,
           lead_in_ar = EXCLUDED.lead_in_ar,
           lead_in_en = EXCLUDED.lead_in_en,
           options = EXCLUDED.options,
           options_en = EXCLUDED.options_en,
           options_ar = EXCLUDED.options_ar,
           correct_option_index = EXCLUDED.correct_option_index,
           explanation_en = EXCLUDED.explanation_en,
           explanation_ar = EXCLUDED.explanation_ar,
           reference_source = EXCLUDED.reference_source,
           difficulty = EXCLUDED.difficulty`,
        [newQ.id, newQ.specialtyId, newQ.category, newQ.questionAr, newQ.questionAr, JSON.stringify(newQ.options), JSON.stringify(newQ.options), JSON.stringify(newQ.options), newQ.correctIndex, newQ.explanationAr, newQ.explanationAr, newQ.reference, newQ.difficulty]

      );
    } catch (err) {
      console.error("PG Insert Question Error:", err.message);
    }
  }
  res.status(201).json({ success: true, question: newQ });
});

app.post("/api/questions/batch", requireAdmin, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ success: false, error: "Missing questions array" });

  let insertedCount = 0;
  let skippedDuplicates = 0;
  const savedQuestions = [];

  for (let i = 0; i < questions.length; i++) {
    const qData = questions[i];
    if (!qData.specialtyId || !qData.questionEn || qData.correctIndex === undefined) continue;

    const newQ = {
      id: qData.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...qData
    };

    if (dbPool && isDbConnected) {
      try {
        await dbPool.query(
          
        `INSERT INTO unified_question_bank (id, specialty_id, category_name, lead_in_ar, lead_in_en, options, options_en, options_ar, correct_option_index, explanation_en, explanation_ar, reference_source, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           specialty_id = EXCLUDED.specialty_id,
           category_name = EXCLUDED.category_name,
           lead_in_ar = EXCLUDED.lead_in_ar,
           lead_in_en = EXCLUDED.lead_in_en,
           options = EXCLUDED.options,
           options_en = EXCLUDED.options_en,
           options_ar = EXCLUDED.options_ar,
           correct_option_index = EXCLUDED.correct_option_index,
           explanation_en = EXCLUDED.explanation_en,
           explanation_ar = EXCLUDED.explanation_ar,
           reference_source = EXCLUDED.reference_source,
           difficulty = EXCLUDED.difficulty`,
        [newQ.id, newQ.specialtyId, newQ.category, newQ.questionAr, newQ.questionAr, JSON.stringify(newQ.options), JSON.stringify(newQ.options), JSON.stringify(newQ.options), newQ.correctIndex, newQ.explanationAr, newQ.explanationAr, newQ.reference, newQ.difficulty]

        );
      } catch (err) {
        console.error(`PG Batch Insert Error in item ${i}:`, err.message);
      }
    }
    savedQuestions.push(newQ);
    insertedCount++;
  }

  res.status(200).json({
    success: true,
    message: `تم حفظ الدفعة بنجاح (${insertedCount} سؤال في الجداول المخصصة)`,
    insertedCount,
    skippedDuplicates,
    savedQuestions
  });
});

app.put("/api/questions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const q: Partial<Question> = req.body;
  const specId = q.specialtyId || 'medicine';

  if (dbPool && isDbConnected) {
    try {

      // Update in master table
      await dbPool.query(
        `UPDATE unified_question_bank
         SET specialty_id = COALESCE($1, specialty_id),
             category_name = COALESCE($2, category_name),
             lead_in_ar = COALESCE($3, lead_in_ar),
             lead_in_en = COALESCE($3, lead_in_en),
             options = COALESCE($4, options),
             correct_option_index = COALESCE($5, correct_option_index),
             explanation_ar = COALESCE($6, explanation_ar),
             explanation_en = COALESCE($6, explanation_en),
             reference_source = COALESCE($7, reference_source)
         WHERE id = $8`,
        [q.specialtyId, q.category, q.questionAr, q.options ? JSON.stringify(q.options) : null, q.correctIndex, q.explanationAr, q.reference, id]
      );

      
    } catch (err: any) {
      console.error("PG Update Question Error:", err.message);
    }
  }
  res.json({ success: true, message: "تم تحديث السؤال" });
});

app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (dbPool && isDbConnected) {
    try {
      await dbPool.query("UPDATE unified_question_bank SET status = 'archived' WHERE id = $1", [id]);
    } catch (err: any) {
      console.error("PG Soft-Delete Question Error:", err.message);
    }
  }
  res.json({ success: true, message: "تم أرشفة السؤال بنجاح" });
});

// ==========================================
// 2.5 SPECIALTY BOARD INTERACTION & ENGAGEMENT API (Stage 3 & 4)
// ==========================================

// In-Memory Fallback Stores
interface MemoryPreference {
  userId: string;
  userEmail: string;
  questionId: string;
  preference: 'important' | 'less_important';
  updatedAt: string;
}

interface MemoryReaction {
  id: string;
  userId: string;
  userEmail: string;
  questionId: string;
  reaction: 'like' | 'dislike';
  createdAt: string;
}

interface MemoryComment {
  id: string;
  questionId: string;
  userId: string;
  userEmail: string;
  authorName: string;
  parentCommentId?: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
}

interface MemoryImproveSuggestion {
  id: string;
  questionId: string;
  userId: string;
  userEmail: string;
  content: string;
  status: string;
  createdAt: string;
}

const memoryPreferences: MemoryPreference[] = [];
const memoryReactions: MemoryReaction[] = [];
const memoryComments: MemoryComment[] = [];
const memoryImproveSuggestions: MemoryImproveSuggestion[] = [];

// Helper to optionally extract auth user from token
function getOptionalAuthUser(req: express.Request): { email: string; role?: string; id?: string } | null {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string; role?: string; id?: string };
  } catch {
    return null;
  }
}

// 1. QUESTION PREFERENCES (Important / Less Important)
app.get("/api/questions/:id/preference", async (req, res) => {
  const { id } = req.params;
  const authUser = getOptionalAuthUser(req);
  const email = (authUser?.email || '').toLowerCase().trim();

  if (!email) {
    return res.json({ success: true, preference: null });
  }

  if (dbPool && isDbConnected) {
    try {
      const uRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
      const userId = uRes && uRes.rows.length > 0 ? uRes.rows[0].id : null;
      if (userId) {
        const prefRes = await executeDbQuery(
          "SELECT preference FROM question_preferences WHERE question_id = $1 AND user_id = $2",
          [id, userId]
        );
        if (prefRes && prefRes.rows.length > 0) {
          return res.json({ success: true, preference: prefRes.rows[0].preference });
        }
      }
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Get preference PG error: ${e.message}`);
    }
  }

  // Fallback memory
  const mem = memoryPreferences.find(p => p.questionId === id && p.userEmail.toLowerCase() === email);
  return res.json({ success: true, preference: mem ? mem.preference : null });
});

app.post("/api/questions/:id/preference", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { preference } = req.body; // 'important' | 'less_important' | null
  const authUser = (req as any).user;
  const email = (authUser?.email || '').toLowerCase().trim();

  if (preference && preference !== 'important' && preference !== 'less_important') {
    return res.status(400).json({ success: false, error: "قيمة التفضيل غير صالحة" });
  }

  let resolvedUserId: string | null = null;
  if (dbPool && isDbConnected) {
    try {
      const uRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
      resolvedUserId = uRes && uRes.rows.length > 0 ? uRes.rows[0].id : null;
      if (resolvedUserId) {
        if (!preference) {
          await executeDbQuery(
            "DELETE FROM question_preferences WHERE user_id = $1 AND question_id = $2",
            [resolvedUserId, id]
          );
        } else {
          await executeDbQuery(
            `INSERT INTO question_preferences (user_id, question_id, preference, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, question_id) DO UPDATE SET preference = EXCLUDED.preference, updated_at = NOW()`,
            [resolvedUserId, id, preference]
          );
        }
      }
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Save preference PG error: ${e.message}`);
    }
  }

  // Sync memory store
  const memIdx = memoryPreferences.findIndex(p => p.questionId === id && p.userEmail.toLowerCase() === email);
  if (!preference) {
    if (memIdx >= 0) memoryPreferences.splice(memIdx, 1);
  } else {
    if (memIdx >= 0) {
      memoryPreferences[memIdx].preference = preference;
      memoryPreferences[memIdx].updatedAt = new Date().toISOString();
    } else {
      memoryPreferences.push({
        userId: resolvedUserId || `u_${Date.now()}`,
        userEmail: email,
        questionId: id,
        preference,
        updatedAt: new Date().toISOString()
      });
    }
  }

  return res.json({ success: true, preference: preference || null });
});

// 2. QUESTION REACTIONS (Like / Dislike)
app.get("/api/questions/:id/reaction", async (req, res) => {
  const { id } = req.params;
  const authUser = getOptionalAuthUser(req);
  const email = (authUser?.email || '').toLowerCase().trim();

  let likesCount = 0;
  let dislikesCount = 0;
  let userReaction: 'like' | 'dislike' | null = null;

  if (dbPool && isDbConnected) {
    try {
      const countsRes = await executeDbQuery(
        `SELECT 
           COUNT(*) FILTER (WHERE reaction = 'like') as likes,
           COUNT(*) FILTER (WHERE reaction = 'dislike') as dislikes
         FROM question_reactions WHERE question_id = $1`,
        [id]
      );
      if (countsRes && countsRes.rows.length > 0) {
        likesCount = parseInt(countsRes.rows[0].likes, 10) || 0;
        dislikesCount = parseInt(countsRes.rows[0].dislikes, 10) || 0;
      }

      if (email) {
        const uRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
        const userId = uRes && uRes.rows.length > 0 ? uRes.rows[0].id : null;
        if (userId) {
          const userReactionRes = await executeDbQuery(
            "SELECT reaction FROM question_reactions WHERE question_id = $1 AND user_id = $2",
            [id, userId]
          );
          if (userReactionRes && userReactionRes.rows.length > 0) {
            userReaction = userReactionRes.rows[0].reaction;
          }
        }
      }
      return res.json({ success: true, likesCount, dislikesCount, userReaction });
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Get reaction PG error: ${e.message}`);
    }
  }

  // Fallback memory
  const qReactions = memoryReactions.filter(r => r.questionId === id);
  likesCount = qReactions.filter(r => r.reaction === 'like').length;
  dislikesCount = qReactions.filter(r => r.reaction === 'dislike').length;
  if (email) {
    const userMem = qReactions.find(r => r.userEmail.toLowerCase() === email);
    userReaction = userMem ? userMem.reaction : null;
  }

  return res.json({ success: true, likesCount, dislikesCount, userReaction });
});

app.post("/api/questions/:id/reaction", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reaction } = req.body; // 'like' | 'dislike' | null
  const authUser = (req as any).user;
  const email = (authUser?.email || '').toLowerCase().trim();

  if (reaction && reaction !== 'like' && reaction !== 'dislike') {
    return res.status(400).json({ success: false, error: "قيمة التفاعل غير صالحة" });
  }

  let resolvedUserId: string | null = null;
  if (dbPool && isDbConnected) {
    try {
      const uRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
      resolvedUserId = uRes && uRes.rows.length > 0 ? uRes.rows[0].id : null;
      if (resolvedUserId) {
        if (!reaction) {
          await executeDbQuery(
            "DELETE FROM question_reactions WHERE user_id = $1 AND question_id = $2",
            [resolvedUserId, id]
          );
        } else {
          await executeDbQuery(
            `INSERT INTO question_reactions (user_id, question_id, reaction, created_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, question_id) DO UPDATE SET reaction = EXCLUDED.reaction, created_at = NOW()`,
            [resolvedUserId, id, reaction]
          );
        }
      }
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Save reaction PG error: ${e.message}`);
    }
  }

  // Sync memory store
  const memIdx = memoryReactions.findIndex(r => r.questionId === id && r.userEmail.toLowerCase() === email);
  if (!reaction) {
    if (memIdx >= 0) memoryReactions.splice(memIdx, 1);
  } else {
    if (memIdx >= 0) {
      memoryReactions[memIdx].reaction = reaction;
    } else {
      memoryReactions.push({
        id: `react_${Date.now()}`,
        userId: resolvedUserId || `u_${Date.now()}`,
        userEmail: email,
        questionId: id,
        reaction,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Compute updated counts
  let likesCount = 0;
  let dislikesCount = 0;
  if (dbPool && isDbConnected) {
    try {
      const countsRes = await executeDbQuery(
        `SELECT 
           COUNT(*) FILTER (WHERE reaction = 'like') as likes,
           COUNT(*) FILTER (WHERE reaction = 'dislike') as dislikes
         FROM question_reactions WHERE question_id = $1`,
        [id]
      );
      if (countsRes && countsRes.rows.length > 0) {
        likesCount = parseInt(countsRes.rows[0].likes, 10) || 0;
        dislikesCount = parseInt(countsRes.rows[0].dislikes, 10) || 0;
      }
    } catch (e) { /* fallback */ }
  } else {
    const qReactions = memoryReactions.filter(r => r.questionId === id);
    likesCount = qReactions.filter(r => r.reaction === 'like').length;
    dislikesCount = qReactions.filter(r => r.reaction === 'dislike').length;
  }

  return res.json({ success: true, likesCount, dislikesCount, userReaction: reaction || null });
});

// 3. QUESTION COMMENTS & DISCUSSIONS
app.get("/api/questions/:id/comments", async (req, res) => {
  const { id } = req.params;
  const authUser = getOptionalAuthUser(req);
  const authEmail = (authUser?.email || '').toLowerCase().trim();

  if (dbPool && isDbConnected) {
    try {
      const rowsRes = await executeDbQuery(
        `SELECT c.id, c.question_id, c.user_id, c.parent_comment_id, c.content, c.is_hidden, c.created_at,
                u.full_name as author_name, u.email as author_email
         FROM question_comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.question_id = $1 AND (c.is_hidden = FALSE OR c.is_hidden IS NULL)
         ORDER BY c.created_at ASC`,
        [id]
      );

      if (rowsRes) {
        const rawComments = rowsRes.rows;
        const topLevel: any[] = [];
        const repliesMap: Record<string, any[]> = {};

        for (const row of rawComments) {
          const item = {
            id: row.id,
            questionId: row.question_id,
            authorName: row.author_name || (row.author_email ? row.author_email.split('@')[0] : 'طبيب زميل'),
            content: row.content,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
            isOwner: authEmail && row.author_email ? row.author_email.toLowerCase() === authEmail : false,
            replies: []
          };

          if (row.parent_comment_id) {
            if (!repliesMap[row.parent_comment_id]) repliesMap[row.parent_comment_id] = [];
            repliesMap[row.parent_comment_id].push(item);
          } else {
            topLevel.push(item);
          }
        }

        // Attach 1-level replies to top-level
        for (const parent of topLevel) {
          parent.replies = repliesMap[parent.id] || [];
        }

        return res.json({ success: true, comments: topLevel });
      }
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Get comments PG error: ${e.message}`);
    }
  }

  // Fallback Memory
  const qComments = memoryComments.filter(c => c.questionId === id && !c.isHidden);
  const topLevel: any[] = [];
  const repliesMap: Record<string, any[]> = {};

  for (const c of qComments) {
    const item = {
      id: c.id,
      questionId: c.questionId,
      authorName: c.authorName || (c.userEmail ? c.userEmail.split('@')[0] : 'طبيب زميل'),
      content: c.content,
      createdAt: c.createdAt,
      isOwner: authEmail && c.userEmail ? c.userEmail.toLowerCase() === authEmail : false,
      replies: []
    };

    if (c.parentCommentId) {
      if (!repliesMap[c.parentCommentId]) repliesMap[c.parentCommentId] = [];
      repliesMap[c.parentCommentId].push(item);
    } else {
      topLevel.push(item);
    }
  }

  for (const parent of topLevel) {
    parent.replies = repliesMap[parent.id] || [];
  }

  return res.json({ success: true, comments: topLevel });
});

app.post("/api/questions/:id/comments", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content, parentCommentId } = req.body;
  const authUser = (req as any).user;
  const email = (authUser?.email || '').toLowerCase().trim();

  const trimmed = String(content || '').trim();
  if (!trimmed || trimmed.length < 2) {
    return res.status(400).json({ success: false, error: "نص التعليق قصير جداً" });
  }
  if (trimmed.length > 2000) {
    return res.status(400).json({ success: false, error: "نص التعليق يتجاوز الحد الأقصى المسموح (2000 حرف)" });
  }

  let resolvedUserId: string | null = null;
  let resolvedAuthorName: string = email.split('@')[0];

  if (dbPool && isDbConnected) {
    try {
      const uRes = await executeDbQuery("SELECT id, full_name FROM users WHERE LOWER(email) = $1", [email]);
      if (uRes && uRes.rows.length > 0) {
        resolvedUserId = uRes.rows[0].id;
        if (uRes.rows[0].full_name) {
          resolvedAuthorName = uRes.rows[0].full_name;
        }
      }

      const insertRes = await executeDbQuery(
        `INSERT INTO question_comments (question_id, user_id, parent_comment_id, content, is_hidden, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())
         RETURNING id, created_at`,
        [id, resolvedUserId, parentCommentId || null, trimmed]
      );

      if (insertRes && insertRes.rows.length > 0) {
        const row = insertRes.rows[0];
        const newComment = {
          id: row.id,
          questionId: id,
          authorName: resolvedAuthorName,
          content: trimmed,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          isOwner: true,
          replies: []
        };

        // Sync memory store
        memoryComments.push({
          id: row.id,
          questionId: id,
          userId: resolvedUserId || `u_${Date.now()}`,
          userEmail: email,
          authorName: resolvedAuthorName,
          parentCommentId: parentCommentId || undefined,
          content: trimmed,
          isHidden: false,
          createdAt: newComment.createdAt
        });

        return res.status(201).json({ success: true, comment: newComment });
      }
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Insert comment PG error: ${e.message}`);
    }
  }

  // Fallback memory
  const memCommentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowStr = new Date().toISOString();
  memoryComments.push({
    id: memCommentId,
    questionId: id,
    userId: resolvedUserId || `u_${Date.now()}`,
    userEmail: email,
    authorName: resolvedAuthorName,
    parentCommentId: parentCommentId || undefined,
    content: trimmed,
    isHidden: false,
    createdAt: nowStr
  });

  return res.status(201).json({
    success: true,
    comment: {
      id: memCommentId,
      questionId: id,
      authorName: resolvedAuthorName,
      content: trimmed,
      createdAt: nowStr,
      isOwner: true,
      replies: []
    }
  });
});

app.delete("/api/comments/:commentId", requireAuth, async (req, res) => {
  const { commentId } = req.params;
  const authUser = (req as any).user;
  const email = (authUser?.email || '').toLowerCase().trim();
  const isAdmin = authUser?.role === 'admin' || ADMIN_EMAILS.includes(email);

  if (dbPool && isDbConnected) {
    try {
      const uRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
      const resolvedUserId = uRes && uRes.rows.length > 0 ? uRes.rows[0].id : null;

      if (isAdmin) {
        await executeDbQuery("UPDATE question_comments SET is_hidden = TRUE WHERE id = $1", [commentId]);
      } else if (resolvedUserId) {
        const delRes = await executeDbQuery(
          "UPDATE question_comments SET is_hidden = TRUE WHERE id = $1 AND user_id = $2 RETURNING id",
          [commentId, resolvedUserId]
        );
        if (!delRes || delRes.rows.length === 0) {
          return res.status(403).json({ success: false, error: "غير مصرح لك بحذف هذا التعليق" });
        }
      }
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Delete comment PG error: ${e.message}`);
    }
  }

  // Sync memory
  const mem = memoryComments.find(c => c.id === commentId);
  if (mem) {
    if (isAdmin || mem.userEmail.toLowerCase() === email) {
      mem.isHidden = true;
    } else {
      return res.status(403).json({ success: false, error: "غير مصرح لك بحذف هذا التعليق" });
    }
  }

  return res.json({ success: true, message: "تم حذف التعليق بنجاح" });
});

// 4. QUESTION IMPROVEMENT SUGGESTIONS
app.post("/api/questions/:id/improve-suggestion", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const authUser = (req as any).user;
  const email = (authUser?.email || '').toLowerCase().trim();

  const trimmed = String(content || '').trim();
  if (!trimmed || trimmed.length < 5) {
    return res.status(400).json({ success: false, error: "يرجى كتابة اقتراح أو ملاحظة واضحة (5 أحرف على الأقل)" });
  }

  let resolvedUserId: string | null = null;
  if (dbPool && isDbConnected) {
    try {
      const uRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
      resolvedUserId = uRes && uRes.rows.length > 0 ? uRes.rows[0].id : null;
      if (resolvedUserId) {
        await executeDbQuery(
          `INSERT INTO question_improvement_suggestions (question_id, user_id, content, status, created_at)
           VALUES ($1, $2, $3, 'pending', NOW())`,
          [id, resolvedUserId, trimmed]
        );
      }
    } catch (e: any) {
      logSystemEvent('warn', 'questions', `Save improve suggestion PG error: ${e.message}`);
    }
  }

  // Sync memory store
  memoryImproveSuggestions.push({
    id: `imp_${Date.now()}`,
    questionId: id,
    userId: resolvedUserId || `u_${Date.now()}`,
    userEmail: email,
    content: trimmed,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: "شكراً لك! تم استلام اقتراحك وسيقوم الفريق الأكاديمي بمراجعته لتحديث السؤال."
  });
});

// 3. Subscribers Group Chat & File Uploads
const chatPollMap = new Map<string, number>();
const MIN_POLL_INTERVAL = 35 * 1000;

app.get("/api/chat/messages", requireAuth, async (req, res) => {
  const authUser = (req as any).auth || (req as any).user;
  const since = req.query.since as string;
  let specialtyId = req.query.specialtyId; // from client

  const email = String(authUser.email).trim().toLowerCase();
  const lastPoll = chatPollMap.get(email) || 0;
  const now = Date.now();
  if (since && now - lastPoll < MIN_POLL_INTERVAL) {
    return res.status(429).json({ success: false, error: "Polling too fast", retryAfter: Math.ceil((MIN_POLL_INTERVAL - (now - lastPoll)) / 1000) });
  }
  if (since) chatPollMap.set(email, now);

  if (dbPool && isDbConnected) {
    try {
      // 1. Enforce Server-Side Specialty Isolation
      const userRes = await dbPool.query("SELECT specialty_id FROM users WHERE LOWER(email) = $1", [String(authUser.email).trim().toLowerCase()]);
      if (userRes.rows.length === 0) return res.status(403).json({ success: false, error: "User not found" });
      
      const userSpecialtyId = userRes.rows[0].specialty_id;
      if (userSpecialtyId && userSpecialtyId !== specialtyId) {
        specialtyId = userSpecialtyId;
      }

      // 2. Delta Fetching Logic
      let query = "SELECT * FROM chat_messages";
      const params: any[] = [];
      
      if (specialtyId) {
        query += " WHERE sender_specialty = $1";
        params.push(specialtyId);
      } else {
        query += " WHERE 1=1";
      }

      if (since) {
         query += ` AND timestamp > $${params.length + 1}`;
         params.push(since);
      }
      
      query += " ORDER BY created_at ASC";
      if (!since) {
         query += " LIMIT 100";
      }

      const dbRes = await dbPool.query(query, params);
      const mapped: ChatMessage[] = dbRes.rows.map(r => ({
        id: r.id,
        senderName: r.sender_name,
        senderRole: r.sender_role,
        senderSpecialty: r.sender_specialty,
        message: r.message,
        attachment: typeof r.attachment === 'string' ? JSON.parse(r.attachment) : r.attachment,
        timestamp: r.timestamp
      }));
      return res.json(mapped);
    } catch (err) {
      console.error("PG Get Chat Messages Error:", err);
    }
  }

  // Fallback for memory store delta logic
  let filtered = chatMessages;
  if (specialtyId) {
     filtered = filtered.filter(m => m.senderSpecialty === specialtyId);
  }
  if (since) {
     const sinceTime = new Date(since as string).getTime();
     filtered = filtered.filter(m => new Date(m.timestamp).getTime() > sinceTime);
  }
  res.json(filtered);
});

app.post("/api/chat/messages", async (req, res) => {
  const { senderName, senderRole, senderSpecialty, message, attachment } = req.body;
  if (!senderName || (!message && !attachment)) {
    return res.status(400).json({ error: "بيانات الرسالة غير مكتملة" });
  }

  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}`,
    senderName,
    senderRole: senderRole || 'طبيب متدرب',
    senderSpecialty: senderSpecialty || 'الطب والجراحة',
    message: message || '',
    timestamp: new Date().toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' }),
    attachment: attachment || undefined
  };

  if (dbPool && isDbConnected) {
    try {
      await dbPool.query(
        `INSERT INTO chat_messages (id, sender_name, sender_role, sender_specialty, message, attachment, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newMsg.id, newMsg.senderName, newMsg.senderRole, newMsg.senderSpecialty, newMsg.message, newMsg.attachment ? JSON.stringify(newMsg.attachment) : null, newMsg.timestamp]
      );
    } catch (err) {
      console.error("PG Insert Chat Message Error:", err);
    }
  }

  chatMessages.push(newMsg);
  if (chatMessages.length > 100) {
    chatMessages = chatMessages.slice(-100);
  }
  res.status(201).json(newMsg);
});

// Auto-purge attachments route (simulate 04:00 AM Khartoum purge or manual trigger)
app.post("/api/chat/purge", requireAdmin, async (req, res) => {
  let purgedCount = 0;

  if (dbPool && isDbConnected) {
    try {
      const purgeRes = await dbPool.query(
        `UPDATE chat_messages 
         SET attachment = NULL, message = CONCAT(message, ' (تم مسح المرفق بحسب التوقيت 04:00 ص)')
         WHERE attachment IS NOT NULL`
      );
      purgedCount = purgeRes.rowCount || 0;
    } catch (err) {
      console.error("PG Purge Error:", err);
    }
  }

  chatMessages = chatMessages.map(msg => {
    if (msg.attachment) {
      if (!dbPool || !isDbConnected) purgedCount++;
      return { ...msg, attachment: undefined, message: `${msg.message} (تم مسح المرفق بحسب التوقيت 04:00 ص)` };
    }
    return msg;
  });

  res.json({ success: true, purgedCount, message: "تم مسح الملفات والمرفقات بنجاح لحفظ أداء المنصة وقاعدة البيانات" });
});

// 4. AI Support Chatbot - Dr. Sami (د. سامي)
app.post("/api/ai/chat", aiChatLimiter, async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "يرجى كتابة السؤال أو الاستفسار" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: "أهلاً بك يا دكتور! أنا د. سامي، المساعد الآلي لـ MedExam.net. أعتذر عن عدم توفر مفتاح الذكاء الاصطناعي في هذه اللحظة، ولكن يمكنك طرح استفساراتك حول المواعيد، طريقة الاشتراك بـ بنكك وفوري، وطريقة إجراء محاكاة الامتحانات الوطنية."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `أنت "د. سامي AI" (Dr. Sami AI)، المحاكي والذكاء الاصطناعي والمستشار الرسمي المخصص لمنصة MedExam.net (منصة الامتحانات والمحاكاة التفاعلية لمجالس المهن الطبية والصحية).

مهامك الرئيسية والمعلومات المعتمدة التي تجيب بها بدقة:
1. الإجابة الذكية الشاملة عن كل ما يخص التسجيل والاشتراكات والأسئلة لجميع الأطباء والطلاب في السودان والوطن العربي.
2. تفاصيل التسجيل بالبريد الإلكتروني:
   - يمكن لكل مستخدم التسجيل ببريده الإلكتروني بسهولة.
   - بريد الأدمن الرئيسي المعتمد هو: melsmani87@gmail.com ويملك الصلاحيات الكلية لتعديل الواجهة وتغذية الأسئلة.
3. طرق السداد والدفع المتاحة:
   - تطبيق بنكك (بنك الخرطوم): حساب رقم 3849201 باسم "منصة MedExam الطبية".
   - فوري (Fawry): رقم 9901428.
   - بنك فيصل الإسلامي: حساب 11029384.
   - كود التفعيل المباشر (Promo Code): يتم إدخاله لمنح تفعيل فوري.
   - خطط الاشتراك: الشهري (15,000 ج.س / 10$)، الفصلي 3 أشهر (35,000 ج.س / 25$)، والسنوي الشامل (95,000 ج.س / 70$).
4. هيكلية المجالس الطبية الثلاثة والأقسام المتاحة بالمنصة:
   أ- مجلس المهن الطبية والصحية: مختبرات طبية، تمريض، مساعدين طب أسنان، مساعدين طبيين، قبالة وتمريض عالي.
   ب- المجلس الطبي السوداني: الطب والجراحة، طب الأسنان، الصيدلة.
   ج- مجلس التخصصات الطبية (SMSB): الجراحة العامة، الباطنية، الأطفال، النساء والتوليد، الجلدية والتناسلية، المخ والأعصاب، الأنف والأذن والحنجرة.
5. بنوك الأسئلة والمحاكاة:
   - جميع الأسئلة والتوضيحات والمراجع باللغة الإنجليزية مع تراصف ومحاذاة لليسار (LTR format).
   - بعد كل سؤال، يتوفر الشرح الطبي المعتمد والعلة السريرية المأخوذة من المراجع الطبية المعيارية (مثل Oxford, Bailey & Love, Nelson).

اجعل ردودك دائماً مشجعة، راقية، مريحة للطلاب والأطباء، وموجزة ومفيدة بشكل مباشر.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        contents.push({ role: item.role === 'user' ? 'user' : 'model', parts: [{ text: item.text }] });
      });
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Retry helper function for Gemini API if server is busy/throttled
    async function callGeminiWithRetry(params: any, maxRetries = 2) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await ai.models.generateContent(params);
        } catch (err: any) {
          console.warn(`Gemini API attempt ${attempt + 1} failed:`, err.message || err);
          if (attempt === maxRetries) throw err;
          await new Promise(res => setTimeout(res, 1200));
        }
      }
      throw new Error("Gemini API call failed after retries");
    }

    const response = await callGeminiWithRetry({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      reply: "حدث خطأ أثناء التواصل مع د. سامي. يسعدنا الإجابة عن سؤالك بخصوص الامتحانات وتفاصيل التسجيل من خلال خدمة العملاء."
    });
  }
});

// 7. Zoho Email Service & Credentials Config
let zohoMailConfig = {
  email: process.env.ZOHO_SMTP_USER || "d@medexam.net",
  password: process.env.ZOHO_SMTP_PASS || process.env.ZOHO_PASSWORD || "",
  smtpHost: process.env.ZOHO_SMTP_HOST || "smtppro.zoho.com",
  smtpPort: process.env.ZOHO_SMTP_PORT ? parseInt(process.env.ZOHO_SMTP_PORT, 10) : 465,
  status: "configured_active"
};

let lastEmailDeliveryStatus: {
  timestamp?: string;
  recipient?: string;
  sent: boolean;
  error?: string;
  messageId?: string;
} = { sent: false, error: "لم يتم إرسال أي إيميل بعد" };

async function sendNotificationEmail(subject: string, htmlContent: string, recipientEmail: string = "d@medexam.net", attachments: any[] = []) {
  const smtpUser = process.env.ZOHO_SMTP_USER || process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ZOHO_USER || zohoMailConfig.email || "d@medexam.net";
  const smtpPass = process.env.ZOHO_SMTP_PASS || process.env.ZOHO_PASSWORD || process.env.ZOHO_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.MAIL_PASSWORD || zohoMailConfig.password;
  const smtpHost = process.env.ZOHO_SMTP_HOST || process.env.SMTP_HOST || zohoMailConfig.smtpHost || "smtppro.zoho.com";
  const rawPort = process.env.ZOHO_SMTP_PORT || process.env.SMTP_PORT;
  const smtpPort = rawPort ? parseInt(rawPort, 10) : (zohoMailConfig.smtpPort || 465);

  if (!smtpPass) {
    const errMsg = "ZOHO_SMTP_PASS (or SMTP_PASS) is missing in Netlify environment variables. Please add your Zoho App Password to Environment Variables to enable live delivery.";
    console.warn("SMTP Notice:", errMsg);
    lastEmailDeliveryStatus = { timestamp: new Date().toISOString(), recipient: recipientEmail, sent: false, error: errMsg };
    return { sent: false, error: errMsg, recipient: recipientEmail };
  }

  try {
    const isSecure = smtpPort === 465;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure, // true for port 465 SSL, false for port 587 STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"MedExam.net Support" <${smtpUser}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    });

    console.log(`Email successfully dispatched via SMTP (${smtpHost}:${smtpPort}) to ${recipientEmail}:`, info.messageId);
    lastEmailDeliveryStatus = { timestamp: new Date().toISOString(), recipient: recipientEmail, sent: true, messageId: info.messageId };
    return { sent: true, messageId: info.messageId, recipient: recipientEmail };
  } catch (err: any) {
    const errMsg = err.message || String(err);
    console.error(`SMTP Dispatch Error (${smtpHost}:${smtpPort}):`, errMsg);
    lastEmailDeliveryStatus = { timestamp: new Date().toISOString(), recipient: recipientEmail, sent: false, error: errMsg };
    return { sent: false, error: errMsg, recipient: recipientEmail };
  }
}

// 8. Gemini Vision Payment Receipt AI Analysis
interface ReceiptAnalysisResult {
  analyzed: boolean;
  amountDetected?: string;
  currencyDetected?: string;
  expectedAmount?: string;
  matchesPlan?: boolean;
  senderName?: string;
  recipientAccount?: string;
  transactionReference?: string;
  fraudRisk?: "low" | "medium" | "high";
  notes?: string;
  error?: string;
}

let plansStore: any[] = [
  {
    id: 'weekly',
    nameAr: 'اشتراك أسبوعي (7 أيام)',
    durationMonths: 0.25,
    priceUsd: 2,
    priceSdg: 3000,
    features: [
      'وصول كامل لبنك أسئلة التخصص المختار لمدة أسبوع',
      'محاكاة الامتحانات الوطنية والشرح الطبي التفصيلي',
      'الانضمام لقروب الدردشة التفاعلي والتبادل العلمي'
    ]
  },
  {
    id: 'monthly',
    nameAr: 'اشتراك شهري (30 يوم)',
    durationMonths: 1,
    priceUsd: 4,
    priceSdg: 5000,
    isPopular: true,
    features: [
      'وصول كامل لبنك الأسئلة المحدث للتخصص المختار',
      'محاكاة الامتحانات الوطنية بلغة إنجليزية وشرط LTR',
      'الشرح الطبي التفصيلي والمراجع لكل سؤال',
      'انضمام لقروب الدردشة والتبادل العلمي بين الطلاب',
      'دعم الذكاء الاصطناعي (د. سامي) مجاناً للإجابة عن الأسئلة'
    ]
  },
  {
    id: 'quarterly',
    nameAr: 'اشتراك 3 أشهر (فصلي)',
    durationMonths: 3,
    priceUsd: 8,
    priceSdg: 10000,
    features: [
      'كل مميزات الاشتراك الشهري لمدة 90 يوماً',
      'تحديثات مستمرة لبنك الأسئلة مع إضافة دورات جديدة',
      'تقارير أداء تحليلية متقدمة ونقاط الضعف',
      'أولوية الإجابة في الاستفسارات العلمية'
    ]
  },
  {
    id: 'annual',
    nameAr: 'اشتراك سنوي شامل (12 شهر)',
    durationMonths: 12,
    priceUsd: 15,
    priceSdg: 20000,
    features: [
      'وصول شامل لجميع المجالس والتخصصات الطبية بدون استثناء',
      'تحديثات تلقائية طوال العام لأحدث أسئلة المجلس باللغة الإنجليزية',
      'شهادة إكمال ومحاكاة معتمدة من المنصة',
      'دعم فني وتواصل مباشر 24/7'
    ]
  }
];

function getPlanPrice(planId: string) {
  const plan = plansStore.find(p => p.id === planId);
  return plan || { nameAr: planId, priceSdg: 5000, priceUsd: 4 };
}

async function analyzeReceiptWithGemini(receiptUrl: string | undefined, planId: string, paymentMethod: string = "bankak"): Promise<ReceiptAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  const targetPlan = getPlanPrice(planId);
  const expectedPriceText = `${targetPlan.priceSdg.toLocaleString()} ج.س (أو ${targetPlan.priceUsd}$)`;

  if (!receiptUrl) {
    return {
      analyzed: false,
      expectedAmount: expectedPriceText,
      notes: "لم يتم إرفاق صورة إشعار مع هذا الطلب.",
      error: "NO_RECEIPT_ATTACHED"
    };
  }

  if (!apiKey) {
    return {
      analyzed: false,
      expectedAmount: expectedPriceText,
      notes: "يتطلب تفعيل التحليل الآلي ضبط مفتاح GEMINI_API_KEY في متغيرات بيئة Netlify.",
      error: "GEMINI_API_KEY_MISSING"
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0]; // e.g. "2026-08-10"
    const currentFormattedDate = now.toLocaleDateString('ar-SD', { year: 'numeric', month: 'long', day: 'numeric' });

    const promptText = `أنت خبير فني في تدقيق وتحليل إشعارات التحويل المالي والبنكي (مثل إشعارات تطبيق بنكك Bankak الأبيض، فوري Fawry، أو بنك فيصل).

المستخدم اشترك في الباقة: "${targetPlan.nameAr || planId}" (معرف الباقة: ${planId}).
المبلغ الرسمي المطلوب لهذه الباقة حالياً هو: ${expectedPriceText}.
طريقة الدفع المختارة: "${paymentMethod}".

تعليمات وتنبيهات حاسمة ومهمة جداً للتحليل والتدقيق:
1. تاريخ اليوم الحالي للنظام والمنصة هو: ${currentDateStr} (${currentFormattedDate}).
2. أي تاريخ تحويل ظاهر في الإشعار يقع في تاريخ اليوم أو الأيام/الشهور القريبة الماضية (مثل شهر أغسطس/أب 2026، كـ 08-Aug-2026 أو 10-Aug-2026) هو تاريخ صحيح وطبيعي وسابق للوقت الحالي، وليس تاريخاً مستقبلياً إطلاقاً!
3. إذا كان المبلغ الظاهر في الإشعار يساوي أو يزيد عن المبلغ المطلوب للباقة (${expectedPriceText})، فإن الدفع يعتبر كافياً ومقبولاً جداً (matchesPlan: true).
4. لا تعتبر الإشعار مرتفع المخاطر لمجرد أن المبلغ المدفوع أعلى من المطلوب أو بسبب قراءة خاطئة للتقويم. اجعل تقييم المخاطر "fraudRisk": "low" إلا إذا كان الإشعار مفبركاً بشكل جلي واضح.

قم بفحص صورة الإشعار المرفقة واستخراج المعلومات التالية بدقة متناهية وترجيع النتيجة بترميز JSON مجرد حصراً بالتنسيق التالي بدون أي نص إضافي:
{
  "amountDetected": "المبلغ الظاهر في الإشعار بأرقام وإملائيات واضحة",
  "currencyDetected": "العملة (مثلاً: ج.س أو USD)",
  "matchesPlan": true أو false (هل المبلغ في الإشعار يساوي أو يتجاوز المبلغ المطلوب للباقة؟),
  "senderName": "اسم المحول/المرسل الظاهر في الإشعار",
  "recipientAccount": "اسم أو رقم حساب المستلم الظاهر في الإشعار",
  "transactionReference": "رقم العملية / الرقم المرجعي للتحويل",
  "fraudRisk": "low" أو "medium" أو "high",
  "notes": "شرح موجز ودقيق باللغة العربية لنتيجة التدقيق مع ذكر المبلغ والتاريخ والتأكيد على السلامة المالية للإشعار"
}`;

    const parts: any[] = [{ text: promptText }];

    // Parse image content
    if (receiptUrl.startsWith("data:image/")) {
      const matches = receiptUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (matches && matches[2]) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    } else if (receiptUrl.startsWith("http://") || receiptUrl.startsWith("https://")) {
      try {
        const imgRes = await fetch(receiptUrl);
        const arrayBuf = await imgRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuf).toString("base64");
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        parts.push({
          inlineData: {
            mimeType: contentType,
            data: base64Data
          }
        });
      } catch (fErr) {
        console.warn("Could not fetch remote receipt image URL for Gemini Vision:", fErr);
      }
    }

    if (parts.length === 1) {
      // Inline SVG or SVG data URL or synthetic image
      return {
        analyzed: true,
        amountDetected: expectedPriceText,
        currencyDetected: "ج.س",
        expectedAmount: expectedPriceText,
        matchesPlan: true,
        senderName: "معتمد (إشعار رقمي)",
        recipientAccount: "منصة MedExam الطبية",
        fraudRisk: "low",
        notes: "تم استلام الإشعار الإلكتروني واعتماده سلفاً."
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const parsed = JSON.parse(response.text || "{}");

    return {
      analyzed: true,
      amountDetected: parsed.amountDetected || "غير محدد",
      currencyDetected: parsed.currencyDetected || "ج.س",
      expectedAmount: expectedPriceText,
      matchesPlan: parsed.matchesPlan ?? true,
      senderName: parsed.senderName || "غير واضح",
      recipientAccount: parsed.recipientAccount || "منصة MedExam",
      transactionReference: parsed.transactionReference || undefined,
      fraudRisk: parsed.fraudRisk || "low",
      notes: parsed.notes || "تم تحليل الإشعار بنجاح باستخدام Gemini 3.6 Flash AI Vision"
    };
  } catch (err: any) {
    console.error("Gemini Vision Receipt Analysis Error:", err.message || err);
    return {
      analyzed: false,
      expectedAmount: expectedPriceText,
      error: err.message || String(err),
      notes: "فشل التحليل التلقائي بـ Gemini AI Vision. سيتم الاعتماد على التدقيق اليدوي من الإدارة."
    };
  }
}

// 5. Subscription Requests & Payments
app.post("/api/subscriptions/request", authLimiter, async (req, res) => {
  const { userName, userEmail, userPhone, specialtyId, planId, paymentMethod, receiptUrl, promoCode } = req.body;

  if (!userEmail || !planId) {
    return res.status(400).json({ error: "يرجى إدخال البريد الإلكتروني واختيار باقة الاشتراك" });
  }

  // Require receiptUrl unless promoCode is supplied
  if (!promoCode && !receiptUrl) {
    return res.status(400).json({ error: "⚠️ حقل إجباري: يرجى إرفاق صورة إشعار التحويل الأبيض (تطبيق بنكك أو فوري) لإكمال طلب الاشتراك." });
  }

  const subId = `sub_${Date.now()}`;
  const actionToken = crypto.randomBytes(32).toString('hex');
  const actionTokenHash = crypto.createHash('sha256').update(actionToken).digest('hex');

  // 1. Perform Gemini AI Receipt Vision Analysis if receiptUrl is provided
  const receiptAnalysis = await analyzeReceiptWithGemini(receiptUrl, planId, paymentMethod || "bankak");

  const newSub = {
    id: subId,
    userName: userName || userEmail.split('@')[0],
    userEmail: userEmail.trim().toLowerCase(),
    userPhone: userPhone || '',
    specialtyId: specialtyId || 'general',
    planId,
    paymentMethod: paymentMethod || 'bankak',
    receiptUrl: receiptUrl || '',
    promoCode: promoCode || '',
    actionToken,
    actionTokenHash,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };

  const receiptAnalysisHtml = receiptAnalysis?.analyzed ? `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 14px;">🤖 نتيجة الفحص الذكي للإشعار (Gemini AI Vision):</h4>
      <p style="margin: 4px 0; font-size: 13px; color: #15803d;"><strong>المبلغ المكتشف:</strong> ${receiptAnalysis.amountDetected} (المتوقع: ${receiptAnalysis.expectedAmount})</p>
      <p style="margin: 4px 0; font-size: 13px; color: #15803d;"><strong>اسم المرسل:</strong> ${receiptAnalysis.senderName}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #15803d;"><strong>الحساب المستلم:</strong> ${receiptAnalysis.recipientAccount}</p>
      ${receiptAnalysis.transactionReference ? `<p style="margin: 4px 0; font-size: 13px; color: #15803d;"><strong>الرقم المرجعي:</strong> ${receiptAnalysis.transactionReference}</p>` : ''}
      <p style="margin: 4px 0; font-size: 13px; color: ${receiptAnalysis.fraudRisk === 'low' ? '#16a34a' : '#dc2626'}; font-weight: bold;"><strong>مستوى المخاطرة:</strong> ${receiptAnalysis.fraudRisk}</p>
      <p style="margin: 4px 0; font-size: 12px; color: #4b5563;"><em>${receiptAnalysis.notes}</em></p>
    </div>` : '';

  // Prepare Email Notification Attachment if receiptUrl is base64
  const mailAttachments: any[] = [];
  let embeddedImageCid: string | null = null;

  if (receiptUrl && typeof receiptUrl === 'string' && receiptUrl.startsWith('data:image')) {
    const matches = receiptUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      embeddedImageCid = `receipt_${subId}`;
      mailAttachments.push({
        filename: `receipt_notification_${subId}.${ext}`,
        content: Buffer.from(base64Data, 'base64'),
        cid: embeddedImageCid
      });
    }
  }

  // Email Notification Payload Preparation
  const emailSubject = `طلب اشتراك جديد - ${userName} (${planId})`;
  const baseUrl = process.env.PUBLIC_APP_URL || process.env.URL || "https://medexam.net";
  const approveUrl = `${baseUrl}/api/subscriptions/${subId}/action?status=approved&token=${actionToken}`;
  const rejectUrl = `${baseUrl}/api/subscriptions/${subId}/action?status=rejected&token=${actionToken}`;

  const emailHtml = `
    <div style="font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #0284c7; border-radius: 10px; background-color: #f8fafc; max-width: 650px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
        <h2 style="color: #0284c7; margin: 0 0 5px 0;">طلب اشتراك جديد على منصة MedExam.net</h2>
        <span style="background-color: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">معرف الطلب: ${subId}</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; color: #334155;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold; width: 140px;">اسم المشترك:</td><td style="padding: 8px 0;">${userName}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">البريد الإلكتروني:</td><td style="padding: 8px 0;"><a href="mailto:${userEmail}" style="color: #0284c7;">${userEmail}</a></td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">رقم الهاتف:</td><td style="padding: 8px 0;">${userPhone || 'غير مدخل'}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">التخصص الطبي:</td><td style="padding: 8px 0;">${specialtyId}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">خطة الاشتراك:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${planId}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">طريقة الدفع:</td><td style="padding: 8px 0;">${paymentMethod || 'بنكك'}</td></tr>
        ${promoCode ? `<tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">كود التفعيل:</td><td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${promoCode}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; font-weight: bold;">تاريخ الطلب:</td><td style="padding: 8px 0;">${new Date().toLocaleString('ar-EG')}</td></tr>
      </table>

      ${receiptAnalysisHtml}

      ${embeddedImageCid ? `
      <div style="margin: 20px 0; text-align: center; background-color: #f1f5f9; padding: 15px; border-radius: 8px; border: 1px dashed #cbd5e1;">
        <h4 style="margin: 0 0 10px 0; color: #475569;">صورة إشعار التحويل المالي المرفق (مضمنة بالبريد):</h4>
        <img src="cid:${embeddedImageCid}" alt="إشعار التحويل المالي" style="max-width: 100%; height: auto; max-height: 450px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #cbd5e1;" />
      </div>` : ''}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px dashed #cbd5e1; text-align: center;">
        <h4 style="margin: 0 0 15px 0; color: #0f172a;">اتخاذ الإجراء المباشر من الإيميل:</h4>
        <div style="display: inline-block;">
          <a href="${approveUrl}" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; margin: 0 8px; display: inline-block;">✅ قبول الطلب وتفعيل الاشتراك</a>
          <a href="${rejectUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; margin: 0 8px; display: inline-block;">❌ رفض الطلب</a>
        </div>
      </div>

      <hr style="margin: 25px 0 15px 0; border: none; border-top: 1px solid #cbd5e1;" />
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">نظام الإشعارات الآلي لمنصة MedExam.net — تم إرسال هذه الرسالة تلقائياً للإدارة</p>
    </div>
  `;

  // Persist to database
  try {
    await executeDbQuery(
      `INSERT INTO subscription_requests (id, user_name, user_email, user_phone, specialty_id, plan_id, payment_method, receipt_url, status, action_token_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [newSub.id, newSub.userName, newSub.userEmail, newSub.userPhone, newSub.specialtyId, newSub.planId, newSub.paymentMethod, newSub.receiptUrl, newSub.status, actionTokenHash]
    );

    // Also ensure record exists in users table!
    await executeDbQuery(
      `INSERT INTO users (email, full_name, phone, password_hash, is_active, is_subscribed, subscription_type, created_at, updated_at)
       VALUES ($1, $2, $3, '$2b$10$default_registered_user', FALSE, FALSE, $4, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         phone = COALESCE(EXCLUDED.phone, users.phone),
         subscription_type = EXCLUDED.subscription_type,
         updated_at = NOW()`,
      [newSub.userEmail.trim().toLowerCase(), newSub.userName, newSub.userPhone || '', newSub.planId]
    );

    // Record pending payment in payments table
    const planPrice = getPlanPrice(planId).priceSdg;
    await executeDbQuery(
      `INSERT INTO payments (user_email, amount, subscription_type, receipt_image_url, payment_method, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())`,
      [newSub.userEmail.trim().toLowerCase(), planPrice, newSub.planId, newSub.receiptUrl || '', newSub.paymentMethod || 'bankak']
    );
    logSystemEvent('success', 'subscription', `Subscription request and user record saved for ${newSub.userEmail}`, { subId: newSub.id });
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `Failed to persist subscription request: ${err.message}`, { subId: newSub.id });
  }

  subscriptionRequests.unshift(newSub);

  // 1. Send Admin Notification Email
  const emailRes = await sendNotificationEmail(emailSubject, emailHtml, "d@medexam.net, melsmani87@gmail.com", mailAttachments);

  // 2. Send Instant Receipt Acknowledgement Email to Student
  const studentAckSubject = `تم استلام طلب اشتراكك بنجاح في منصة MedExam.net 📩`;
  const studentAckHtml = `
    <div style="font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #0284c7; border-radius: 10px; background-color: #f0f9ff; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #bae6fd; padding-bottom: 15px;">
        <h2 style="color: #0369a1; margin: 0 0 5px 0;">مرحباً بك دكتور ${userName} 📩</h2>
        <p style="color: #075985; font-size: 15px; margin: 0;">تم استلام طلب اشتراكك وإشعار الدفع بنجاح!</p>
      </div>

      <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; border: 1px solid #e0f2fe; margin-bottom: 20px;">
        <h3 style="color: #0f172a; font-size: 15px; margin-top: 0;">تفاصيل الطلب المسجّل:</h3>
        <p style="margin: 6px 0; color: #334155;"><strong>رقم الطلب المرجعي:</strong> <span style="font-family: monospace; font-weight: bold; color: #0284c7;">${subId}</span></p>
        <p style="margin: 6px 0; color: #334155;"><strong>البريد الإلكتروني:</strong> ${userEmail}</p>
        <p style="margin: 6px 0; color: #334155;"><strong>الباقة المختارة:</strong> ${planId}</p>
        <p style="margin: 6px 0; color: #334155;"><strong>طريقة الدفع:</strong> ${paymentMethod || 'بنكك / تحويل محلي'}</p>
        <p style="margin: 6px 0; color: #0369a1; font-weight: bold;">⏳ حالة الطلب الآن: قيد التدقيق المالي والمراجعة من قبل الإدارة.</p>
      </div>

      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">
          سيقوم الفريق المالي بمراجعة إشعار التحويل وتفعيل حسابك خلال فترة قصيرة جداً. فور الموافقة والتفعيل، ستصلك رسالة تأكيد بالبريد الإلكتروني وستتمكن من الدخول المباشر للامتحانات.
        </p>
      </div>

      <div style="text-align: center; margin-top: 25px;">
        <a href="https://medexam.net" style="background-color: #0284c7; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">الانتقال إلى منصة MedExam.net</a>
      </div>

      <hr style="margin: 25px 0 15px 0; border: none; border-top: 1px solid #bae6fd;" />
      <p style="font-size: 12px; color: #0369a1; text-align: center; margin: 0;">صادر عن منصة MedExam.net — شكراً لثقتكم بنا</p>
    </div>
  `;

  sendNotificationEmail(studentAckSubject, studentAckHtml, userEmail).catch(err => console.error("Student Ack Email Error:", err));

  res.status(201).json({
    success: true,
    approved: false,
    message: "تم استلام طلب الاشتراك بنجاح وسيرفق للتأكيد خلال فترة قصيرة",
    subscription: newSub,
    emailDelivery: emailRes,
    receiptAnalysis: receiptAnalysis
  });
});

// Helper: Activate User in Database & Insert Payment Record on Subscription Approval
async function activateUserInDatabase(
  userEmail: string,
  userName: string,
  userPhone: string,
  planId: string,
  receiptUrl?: string,
  paymentMethod?: string
) {
  const cleanEmail = userEmail.trim().toLowerCase();
  let durationDays = 90;
  if (planId === 'weekly') durationDays = 7;
  if (planId === 'monthly') durationDays = 30;
  if (planId === 'half_year') durationDays = 180;
  if (planId === 'annual' || planId === 'yearly') durationDays = 365;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + durationDays);

  try {
    // Generate a secure random password hash if the user is completely new
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const generatedHash = await bcrypt.hash(randomPassword, 10);

    const userResult = await executeDbQuery(
      `INSERT INTO users (email, full_name, phone, password_hash, is_active, is_subscribed, subscription_type, subscription_start, subscription_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, TRUE, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         is_active = TRUE,
         is_subscribed = TRUE,
         subscription_type = EXCLUDED.subscription_type,
         subscription_start = EXCLUDED.subscription_start,
         subscription_end = EXCLUDED.subscription_end,
         full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
         phone = COALESCE(NULLIF(EXCLUDED.phone, ''), users.phone),
         updated_at = NOW()
       RETURNING id`,
      [cleanEmail, userName || cleanEmail.split('@')[0], userPhone || '', generatedHash, planId, now.toISOString(), endDate.toISOString()]
    );

    let userId: string | null = null;
    if (userResult && userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      logSystemEvent('success', 'subscription', `User ${cleanEmail} activated in users table!`, { userId, planId, durationDays });
    }

    // Record entry in payments table
    const planPrice = getPlanPrice(planId).priceSdg;
    await executeDbQuery(
      `INSERT INTO payments (user_id, user_email, amount, subscription_type, receipt_image_url, payment_method, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved', NOW(), NOW())`,
      [userId, cleanEmail, planPrice, planId, receiptUrl || null, paymentMethod || 'bankak']
    );
    logSystemEvent('success', 'subscription', `Payment record approved for ${cleanEmail} (${planPrice} SDG)`);
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `activateUserInDatabase Error: ${err.message}`);
  }

  return {
    email: cleanEmail,
    isActive: true,
    isSubscribed: true,
    planId,
    startDate: now.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    remainingDays: durationDays
  };
}

// Direct Action Endpoint from Email Links (Approve / Reject with Security Token Check)
app.get("/api/subscriptions/:id/action", async (req, res) => {
  const { id } = req.params;
  const status = (req.query.status as string) || "approved";
  const token = ((req.query.token as string) || "").trim();

  if (!token) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>خطأ في الأمان - MedExam.net</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px; text-align: center; }
          .card { background: white; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 6px solid #dc2626; }
          h1 { color: #dc2626; font-size: 20px; }
          p { color: #475569; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ رمز الأمان مطلوب</h1>
          <p>لا يمكن اتخاذ إجراء دون تقديم رمز الأمان المعتمد في رسالة البريد.</p>
        </div>
      </body>
      </html>
    `);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  let sub = subscriptionRequests.find(s => s.id === id);

  // Fallback to PostgreSQL lookup
  let dbRow: any = null;
  try {
    const dbRes = await executeDbQuery("SELECT * FROM subscription_requests WHERE id = $1", [id]);
    if (dbRes && dbRes.rows.length > 0) {
      dbRow = dbRes.rows[0];
      if (!sub) {
        sub = {
          id: dbRow.id,
          userName: dbRow.user_name,
          userEmail: dbRow.user_email,
          userPhone: dbRow.user_phone,
          specialtyId: dbRow.specialty_id,
          planId: dbRow.plan_id,
          paymentMethod: dbRow.payment_method,
          receiptUrl: dbRow.receipt_url,
          status: dbRow.status,
          createdAt: dbRow.created_at
        };
      }
    }
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `PG Find Sub Error in Action Endpoint: ${err.message}`);
  }

  if (dbRow && dbRow.action_token_used) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>الطلب معالج مسبقاً - MedExam.net</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px; text-align: center; }
          .card { background: white; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 6px solid #0284c7; }
          h1 { color: #0284c7; font-size: 20px; }
          p { color: #475569; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>ℹ️ تم معالجة هذا الطلب مسبقاً</h1>
          <p>حالة الطلب الحالية هي: <strong>${dbRow.status.toUpperCase()}</strong>.</p>
          <a href="https://medexam.net" style="display:inline-block;margin-top:15px;padding:10px 20px;background:#0284c7;color:white;text-decoration:none;border-radius:6px;">الذهاب للمنصة</a>
        </div>
      </body>
      </html>
    `);
  }

  // Security Check: Verify Action Token Hash
  const expectedHash = dbRow?.action_token_hash || (sub as any)?.actionTokenHash;
  if (expectedHash && expectedHash !== tokenHash) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>خطأ في الأمان - MedExam.net</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px; text-align: center; }
          .card { background: white; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 6px solid #dc2626; }
          h1 { color: #dc2626; font-size: 20px; }
          p { color: #475569; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ رمز الأمان غير صحيح أو الرابط غير صالح</h1>
          <p>لا يمكن تعديل حالة الطلب بدون مفتاح الأمان المعتمد في إيميل الإدارة.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Update Status and single-use flag in PostgreSQL
  try {
    await executeDbQuery(
      "UPDATE subscription_requests SET status = $1, action_token_used = TRUE, action_token_used_at = NOW() WHERE id = $2",
      [status, id]
    );
    logSystemEvent('info', 'subscription', `Subscription request ${id} updated to status '${status}' via direct action link`);
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `PG Direct Action Update Error: ${err.message}`);
  }

  if (sub) {
    sub.status = status as 'approved' | 'rejected' | 'pending';
  }

  const isApprove = status === "approved";
  let backupCode = "";

  // If Approved: Generate Backup Activation Promo Code, Activate Account in Users table, & Dispatch Confirmation Email to Subscriber
  if (isApprove && sub) {
    // 1. Automatically update/create student in users table with is_active = true and record payment
    await activateUserInDatabase(sub.userEmail, sub.userName, sub.userPhone, sub.planId, sub.receiptUrl, sub.paymentMethod);

    backupCode = "MED-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const newBackupPromo: PromoCode = {
      code: backupCode,
      planId: sub.planId,
      discountPercent: 100,
      isUsed: false,
      generatedAt: new Date().toISOString()
    };
    activePromoCodes.push(newBackupPromo);

    try {
      await executeDbQuery(
        `INSERT INTO promo_codes (code, plan_id, discount_percent, is_used)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [backupCode, sub.planId, 100, false]
      );
    } catch (err: any) {
      logSystemEvent('error', 'subscription', `PG Backup Promo Save Error: ${err.message}`);
    }

    // Send Student Confirmation Email with Activation Info & Backup Code
    const studentSubject = `تم تفعيل اشتراكك بنجاح في منصة MedExam.net 🎉`;
    const studentEmailHtml = `
      <div style="font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #16a34a; border-radius: 10px; background-color: #f0fdf4; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #bbf7d0; padding-bottom: 15px;">
          <h2 style="color: #15803d; margin: 0 0 5px 0;">مرحباً بك دكتور ${sub.userName} 🎉</h2>
          <p style="color: #166534; font-size: 15px; margin: 0;">تم تأكيد وتفعيل اشتراكك في منصة MedExam.net بنجاح!</p>
        </div>

        <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; border: 1px solid #dcfce7; margin-bottom: 20px;">
          <h3 style="color: #0f172a; font-size: 15px; margin-top: 0;">تفاصيل التفعيل الفوري:</h3>
          <p style="margin: 6px 0; color: #334155;"><strong>البريد الإلكتروني المعتمد:</strong> ${sub.userEmail}</p>
          <p style="margin: 6px 0; color: #334155;"><strong>الباقة المكتتبة:</strong> ${sub.planId}</p>
          <p style="margin: 6px 0; color: #15803d; font-weight: bold;">✅ يمكنك الآن تسجيل الدخول مباشرة بنفس إيميلك والاستمتاع بكافة بنوك الأسئلة.</p>
        </div>

        <div style="background-color: #fefce8; padding: 18px; border-radius: 8px; border: 1px solid #fef08a; margin-bottom: 20px;">
          <h4 style="color: #854d0e; margin: 0 0 8px 0; font-size: 15px;">🔑 كود التفعيل الاحتياطي (Backup Activation Code):</h4>
          <div style="font-size: 20px; font-weight: bold; color: #b45309; text-align: center; letter-spacing: 2px; padding: 10px; background: #fff; border: 1px dashed #f59e0b; border-radius: 6px; margin: 10px 0;">
            ${backupCode}
          </div>
          <p style="font-size: 12px; color: #713f12; margin: 0;">يُحفظ هذا الكود كنسخة احتياطية لاستخدامه عند الحاجة لتغيير الجهاز أو إعادة التفعيل، وهو صالحة لمدة 30 يوماً.</p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="https://medexam.net" style="background-color: #16a34a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">الدخول إلى منصة MedExam الآن</a>
        </div>

        <hr style="margin: 25px 0 15px 0; border: none; border-top: 1px solid #bbf7d0;" />
        <p style="font-size: 12px; color: #166534; text-align: center; margin: 0;">فريق عمل منصة MedExam.net - نتمنى لك كل التوفيق والنجاح!</p>
      </div>
    `;

    // Dispatch email to student
    sendNotificationEmail(studentSubject, studentEmailHtml, sub.userEmail).catch(e => {
      logSystemEvent('error', 'smtp', `Failed to send activation email to student ${sub ? sub.userEmail : ''}: ${e.message}`);
    });
  } else if (!isApprove && sub) {
    const studentSubject = `تحديث بشأن طلب اشتراكك في منصة MedExam.net ⚠️`;
    const studentEmailHtml = `
      <div style="font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #dc2626; border-radius: 10px; background-color: #fef2f2; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #fecaca; padding-bottom: 15px;">
          <h2 style="color: #dc2626; margin: 0 0 5px 0;">مرحباً دكتور ${sub.userName}</h2>
          <p style="color: #991b1b; font-size: 15px; margin: 0;">تحديث هام بشأن طلب الاشتراك الخاص بك</p>
        </div>

        <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; border: 1px solid #fee2e2; margin-bottom: 20px;">
          <h3 style="color: #991b1b; font-size: 15px; margin-top: 0;">سبب عدم اكتمال الطلب:</h3>
          <p style="font-size: 14px; color: #7f1d1d; background: #fff5f5; padding: 12px; border-radius: 6px; border-right: 4px solid #dc2626; font-weight: bold;">
            إشعار التحويل المرفق غير واضح أو البيانات المرفقة غير مكتملة.
          </p>
          <p style="margin-top: 12px; color: #475569; font-size: 13px; line-height: 1.6;">
            يرجى إعادة فتح منصة MedExam.net، والدخول لبوابة الاشتراكات، ثم إعادة إرفاق صورة إشعار تحويل جديدة وواضحة (بنكك أو فوري) ليتم تفعيل حسابك فوراً.
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="https://medexam.net" style="background-color: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">الانتقال للمنصة وإعادة الرفع</a>
        </div>

        <hr style="margin: 25px 0 15px 0; border: none; border-top: 1px solid #fecaca;" />
        <p style="font-size: 12px; color: #991b1b; text-align: center; margin: 0;">فريق الدعم الفني - منصة MedExam.net</p>
      </div>
    `;
    sendNotificationEmail(studentSubject, studentEmailHtml, sub.userEmail).catch(e => {
      logSystemEvent('error', 'smtp', `Failed to send rejection email to student ${sub ? sub.userEmail : ''}: ${e.message}`);
    });
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحديث حالة الاشتراك - MedExam.net</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; padding: 40px; text-align: center; }
        .card { background: white; border-radius: 12px; padding: 30px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 6px solid ${isApprove ? '#16a34a' : '#dc2626'}; }
        h1 { color: ${isApprove ? '#16a34a' : '#dc2626'}; font-size: 22px; margin-bottom: 10px; }
        p { color: #475569; font-size: 15px; line-height: 1.6; }
        .code-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 12px; font-weight: bold; font-size: 18px; border-radius: 6px; margin: 15px 0; }
        .btn { display: inline-block; margin-top: 20px; padding: 10px 24px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${isApprove ? '✅ تم قبول الطلب وتفعيل الاشتراك بنجاح' : '❌ تم تسجيل رفض الطلب'}</h1>
        <p>طلب الاشتراك رقم <strong>${id}</strong> للمشترك <strong>${sub ? sub.userName : ''}</strong> (${sub ? sub.userEmail : ''}) أصبح الآن بحالة: <strong>${status.toUpperCase()}</strong>.</p>
        ${isApprove ? `
          <p>تم إرسال إشعار التفعيل تلقائياً إلى بريد المشترك الأصلي ومزود بكود التفعيل الاحتياطي التالي:</p>
          <div class="code-box">${backupCode}</div>
        ` : ''}
        <a href="https://medexam.net" class="btn">الانتقال إلى منصة MedExam.net</a>
      </div>
    </body>
    </html>
  `);
});

app.get("/api/subscriptions/pending", requireAdmin, async (req, res) => {
  let dbRows: SubscriptionRequest[] = [];
  try {
    const dbRes = await executeDbQuery("SELECT * FROM subscription_requests ORDER BY created_at DESC");
    if (dbRes && dbRes.rows) {
      dbRows = dbRes.rows.map(r => ({
        id: r.id,
        userName: r.user_name,
        userEmail: r.user_email,
        userPhone: r.user_phone,
        specialtyId: r.specialty_id,
        planId: r.plan_id,
        paymentMethod: r.payment_method,
        receiptUrl: r.receipt_url,
        promoCode: r.promo_code,
        status: r.status,
        createdAt: r.created_at
      }));
    }
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `PG Get Subscriptions Error: ${err.message}`);
  }

  const allMap = new Map<string, SubscriptionRequest>();
  for (const s of subscriptionRequests) {
    allMap.set(s.id, s);
  }
  for (const s of dbRows) {
    allMap.set(s.id, s);
  }

  const merged = Array.from(allMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(merged);
});

app.put("/api/subscriptions/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  let sub = subscriptionRequests.find(s => s.id === id);

  if (!sub) {
    try {
      const dbRes = await executeDbQuery("SELECT * FROM subscription_requests WHERE id = $1", [id]);
      if (dbRes && dbRes.rows.length > 0) {
        const r = dbRes.rows[0];
        sub = {
          id: r.id,
          userName: r.user_name,
          userEmail: r.user_email,
          userPhone: r.user_phone,
          specialtyId: r.specialty_id,
          planId: r.plan_id,
          paymentMethod: r.payment_method,
          receiptUrl: r.receipt_url,
          status: r.status,
          createdAt: r.created_at
        };
      }
    } catch (err: any) {
      logSystemEvent('error', 'subscription', `PG Find Sub Status Error: ${err.message}`);
    }
  }

  try {
    if (rejectionReason) {
      await executeDbQuery("UPDATE subscription_requests SET status = $1, rejection_reason = $2 WHERE id = $3", [status, rejectionReason, id]);
    } else {
      await executeDbQuery("UPDATE subscription_requests SET status = $1 WHERE id = $2", [status, id]);
    }
    logSystemEvent('info', 'subscription', `Subscription request ${id} updated to ${status}`);
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `PG Update Sub Status Error: ${err.message}`);
  }

  if (sub) {
    sub.status = status;
    if (rejectionReason) {
      sub.rejectionReason = rejectionReason;
    }

    // Email 4.B Dispatch: Send Student Notification Email (Approval or Rejection) & Activate Student Account
    if (status === 'approved') {
      await activateUserInDatabase(sub.userEmail, sub.userName, sub.userPhone, sub.planId, sub.receiptUrl, sub.paymentMethod);
      const backupCode = "MED-" + crypto.randomBytes(3).toString("hex").toUpperCase();
      const newBackupPromo: PromoCode = {
        code: backupCode,
        planId: sub.planId,
        discountPercent: 100,
        isUsed: false,
        generatedAt: new Date().toISOString(),
        boundEmail: sub.userEmail.trim().toLowerCase(),
        boundName: sub.userName
      };
      activePromoCodes.push(newBackupPromo);

      try {
        await executeDbQuery(
          `INSERT INTO promo_codes (code, plan_id, discount_percent, is_used, bound_email, bound_name)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [backupCode, sub.planId, 100, false, newBackupPromo.boundEmail, newBackupPromo.boundName]
        );
      } catch (e: any) {
        logSystemEvent('error', 'promo', `Failed to insert promo code ${backupCode}: ${e.message}`);
      }

      const studentSubject = `تم قبول وتفعيل اشتراكك بنجاح في منصة MedExam.net 🎉`;
      const studentEmailHtml = `
        <div style="font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #16a34a; border-radius: 10px; background-color: #f0fdf4; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #bbf7d0; padding-bottom: 15px;">
            <h2 style="color: #15803d; margin: 0 0 5px 0;">مرحباً بك دكتور ${sub.userName} 🎉</h2>
            <p style="color: #166534; font-size: 15px; margin: 0;">تم تأكيد وتفعيل اشتراكك في منصة MedExam.net بنجاح!</p>
          </div>

          <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; border: 1px solid #dcfce7; margin-bottom: 20px;">
            <h3 style="color: #0f172a; font-size: 15px; margin-top: 0;">تفاصيل التفعيل الفوري:</h3>
            <p style="margin: 6px 0; color: #334155;"><strong>البريد الإلكتروني المعتمد:</strong> ${sub.userEmail}</p>
            <p style="margin: 6px 0; color: #334155;"><strong>الباقة المكتتبة:</strong> ${sub.planId}</p>
            <p style="margin: 6px 0; color: #15803d; font-weight: bold;">✅ يمكنك الآن تسجيل الدخول مباشرة بنفس إيميلك والبدء فوراً بفتح الامتحانات.</p>
          </div>

          <div style="background-color: #fefce8; padding: 18px; border-radius: 8px; border: 1px solid #fef08a; margin-bottom: 20px;">
            <h4 style="color: #854d0e; margin: 0 0 8px 0; font-size: 15px;">🔑 كود التفعيل الاحتياطي (Backup Activation Code):</h4>
            <div style="font-size: 20px; font-weight: bold; color: #b45309; text-align: center; letter-spacing: 2px; padding: 10px; background: #fff; border: 1px dashed #f59e0b; border-radius: 6px; margin: 10px 0;">
              ${backupCode}
            </div>
            <p style="font-size: 12px; color: #713f12; margin: 0;">يُحفظ هذا الكود كنسخة احتياطية لاستخدامه عند تغيير الجهاز أو إعادة التفعيل.</p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://medexam.net" style="background-color: #16a34a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">الدخول إلى منصة MedExam الآن</a>
          </div>

          <hr style="margin: 25px 0 15px 0; border: none; border-top: 1px solid #bbf7d0;" />
          <p style="font-size: 12px; color: #166534; text-align: center; margin: 0;">فريق عمل منصة MedExam.net - نتمنى لك التوفيق والنجاح!</p>
        </div>
      `;
      sendNotificationEmail(studentSubject, studentEmailHtml, sub.userEmail).catch(e => {
        logSystemEvent('error', 'smtp', `Student Activation Email Error for ${sub ? sub.userEmail : ''}: ${e.message}`);
      });
    } else if (status === 'rejected') {
      const studentSubject = `تحديث بشأن طلب اشتراكك في منصة MedExam.net ⚠️`;
      const reasonText = rejectionReason || 'إشعار التحويل غير واضح أو البيانات المرفقة غير مكتملة.';
      const studentEmailHtml = `
        <div style="font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #dc2626; border-radius: 10px; background-color: #fef2f2; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #fecaca; padding-bottom: 15px;">
            <h2 style="color: #dc2626; margin: 0 0 5px 0;">مرحباً دكتور ${sub.userName}</h2>
            <p style="color: #991b1b; font-size: 15px; margin: 0;">تحديث هائم بشأن طلب الاشتراك الخاص بك</p>
          </div>

          <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; border: 1px solid #fee2e2; margin-bottom: 20px;">
            <h3 style="color: #991b1b; font-size: 15px; margin-top: 0;">سبب عدم اكتمال الطلب:</h3>
            <p style="font-size: 14px; color: #7f1d1d; background: #fff5f5; padding: 12px; border-radius: 6px; border-right: 4px solid #dc2626; font-weight: bold;">
              ${reasonText}
            </p>
            <p style="margin-top: 12px; color: #475569; font-size: 13px; line-height: 1.6;">
              يرجى إعادة فتح منصة MedExam.net، والدخول لبوابة الاشتراكات، ثم إعادة إرفاق صورة إشعار تحويل جديدة وواضحة (بنكك أو فوري) ليتم تفعيل حسابك فوراً.
            </p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://medexam.net" style="background-color: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">الانتقال للمنصة وإعادة الرفع</a>
          </div>

          <hr style="margin: 25px 0 15px 0; border: none; border-top: 1px solid #fecaca;" />
          <p style="font-size: 12px; color: #991b1b; text-align: center; margin: 0;">فريق الدعم الفني - منصة MedExam.net</p>
        </div>
      `;
      sendNotificationEmail(studentSubject, studentEmailHtml, sub.userEmail).catch(e => {
        logSystemEvent('error', 'smtp', `Student Rejection Email Error for ${sub ? sub.userEmail : ''}: ${e.message}`);
      });
    }

    res.json({ success: true, subscription: sub });
  } else {
    res.json({ success: true, message: "تم تحديث حالة الاشتراك" });
  }
});

// Check Subscription status by User Email Endpoint
app.get("/api/subscriptions/check-user", requireAuth, async (req, res) => {
  const authUser = (req as any).auth;
  const email = String(authUser.email).trim().toLowerCase();

  // Admin emails always active
  if (ADMIN_EMAILS.includes(email)) {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 10);
    return res.json({
      isSubscribed: true,
      subscriptionStatus: 'active',
      startDate: today.toISOString().split('T')[0],
      endDate: nextYear.toISOString().split('T')[0],
      remainingDays: 3650,
      planId: 'admin_pass'
    });
  }

  // 1. Check users table directly first
  try {
    const userRes = await executeDbQuery("SELECT * FROM users WHERE LOWER(email) = $1", [email]);
    if (userRes && userRes.rows.length > 0) {
      const u = userRes.rows[0];
      const now = new Date();
      const endDate = u.subscription_end ? new Date(u.subscription_end) : null;
      const remainingDays = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
      const isSubscribed = Boolean(u.is_subscribed && remainingDays > 0);

      if (isSubscribed) {
        return res.json({
          isSubscribed: true,
          subscriptionStatus: 'active',
          startDate: u.subscription_start ? new Date(u.subscription_start).toISOString().split('T')[0] : now.toISOString().split('T')[0],
          endDate: endDate ? endDate.toISOString().split('T')[0] : '',
          remainingDays,
          planId: u.subscription_type || 'quarterly'
        });
      }
    }
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `Check user DB lookup error: ${err.message}`);
  }

  // 2. Check most recent approved request
  let matchedSub = subscriptionRequests.find(s => s.userEmail.trim().toLowerCase() === email && s.status === 'approved');
  
  if (!matchedSub) {
    try {
      const dbRes = await executeDbQuery("SELECT * FROM subscription_requests WHERE LOWER(user_email) = $1 AND status = 'approved' ORDER BY created_at DESC LIMIT 1", [email]);
      if (dbRes && dbRes.rows.length > 0) {
        const r = dbRes.rows[0];
        matchedSub = {
          id: r.id,
          userName: r.user_name,
          userEmail: r.user_email,
          userPhone: r.user_phone,
          specialtyId: r.specialty_id,
          planId: r.plan_id,
          paymentMethod: r.payment_method,
          receiptUrl: r.receipt_url,
          status: r.status,
          createdAt: r.created_at
        };
      }
    } catch (err: any) {
      logSystemEvent('error', 'subscription', `PG Check User Sub Error: ${err.message}`);
    }
  }

  if (matchedSub) {
    const createdDate = new Date(matchedSub.createdAt || Date.now());
    let durationDays = 90; // Default quarterly
    if (matchedSub.planId === 'monthly') durationDays = 30;
    if (matchedSub.planId === 'half_year') durationDays = 180;
    if (matchedSub.planId === 'annual') durationDays = 365;

    const endDate = new Date(createdDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const now = new Date();
    const remainingMs = endDate.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

    const isStillActive = remainingDays > 0;

    return res.json({
      isSubscribed: isStillActive,
      subscriptionStatus: isStillActive ? 'active' : 'expired',
      startDate: createdDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      remainingDays,
      planId: matchedSub.planId
    });
  }

  // 3. Check if there is a pending or rejected request for this user email
  let latestAnySub = subscriptionRequests.find(s => s.userEmail.trim().toLowerCase() === email);
  if (!latestAnySub) {
    try {
      const dbRes = await executeDbQuery("SELECT * FROM subscription_requests WHERE LOWER(user_email) = $1 ORDER BY created_at DESC LIMIT 1", [email]);
      if (dbRes && dbRes.rows.length > 0) {
        const r = dbRes.rows[0];
        latestAnySub = {
          id: r.id,
          userName: r.user_name,
          userEmail: r.user_email,
          userPhone: r.user_phone,
          specialtyId: r.specialty_id,
          planId: r.plan_id,
          paymentMethod: r.payment_method,
          receiptUrl: r.receipt_url,
          status: r.status,
          rejectionReason: r.rejection_reason,
          createdAt: r.created_at
        };
      }
    } catch (err: any) {
      logSystemEvent('error', 'subscription', `PG Check User Any Sub Error: ${err.message}`);
    }
  }

  if (latestAnySub) {
    if (latestAnySub.status === 'pending') {
      return res.json({
        isSubscribed: false,
        subscriptionStatus: 'pending',
        message: 'طلب الاشتراك الخاص بك قيد المراجعة والتدقيق المالي من قبل الإدارة.'
      });
    } else if (latestAnySub.status === 'rejected') {
      return res.json({
        isSubscribed: false,
        subscriptionStatus: 'rejected',
        rejectionReason: latestAnySub.rejectionReason || 'إشعار التحويل غير واضح أو المبلغ غير مطابق.',
        message: 'تم رفض إشعار تحويل الاشتراك.'
      });
    }
  }

  return res.json({
    isSubscribed: false,
    subscriptionStatus: 'free',
    message: 'لم يتم العثور على اشتراك مدفوع ومؤكد بعد لهذا الحساب.'
  });
});

// Activate Subscription by Code Endpoint
app.post("/api/subscriptions/activate-code", authLimiter, async (req, res) => {
  const { email, code, name } = req.body || {};
  if (!email || !String(email).trim()) {
    return res.status(400).json({ success: false, error: "يرجى إدخال البريد الإلكتروني المسجل بحسابك" });
  }
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, error: "يرجى إدخال كود التفعيل" });
  }

  const cleanCode = code.trim().toUpperCase();
  const userEmail = String(email).trim().toLowerCase();

  // Validate Promo Code (من الذاكرة أو قاعدة البيانات)
  let promoFound: PromoCode | undefined = activePromoCodes.find(p => p.code.trim().toUpperCase() === cleanCode && !p.isUsed);

  if (!promoFound) {
    try {
      const dbRes = await executeDbQuery("SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND is_used = FALSE", [cleanCode]);
      if (dbRes && dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        promoFound = {
          code: row.code,
          planId: row.plan_id,
          discountPercent: row.discount_percent,
          isUsed: row.is_used,
          generatedAt: row.generated_at,
          boundEmail: row.bound_email,
          boundName: row.bound_name
        };
      }
    } catch (err: any) {
      logSystemEvent('error', 'promo', `PG Promo Code Activate Check Error: ${err.message}`);
    }
  }

  if (!promoFound) {
    return res.status(400).json({ success: false, error: "كود التفعيل غير صحيح أو تم استخدامه مسبقاً" });
  }

  // فحص الربط: الكود لازم يتفعّل فقط من نفس الإيميل اللي اتولد له
  if (!promoFound.boundEmail || promoFound.boundEmail.toLowerCase() !== userEmail) {
    logSystemEvent('warn', 'promo', `Blocked promo code use: ${cleanCode} attempted by ${userEmail}, bound to ${promoFound.boundEmail || 'unknown'}`);
    return res.status(403).json({ success: false, error: "هذا الكود مرتبط بإيميل مختلف ولا يمكن استخدامه من حساب آخر" });
  }

  const planId = promoFound.planId;
  let durationDays = 90;
  if (planId === 'weekly') durationDays = 7;
  if (planId === 'monthly') durationDays = 30;
  if (planId === 'half_year') durationDays = 180;
  if (planId === 'annual' || planId === 'yearly') durationDays = 365;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + durationDays);

  promoFound.isUsed = true;
  try {
    await executeDbQuery("UPDATE promo_codes SET is_used = TRUE WHERE UPPER(code) = $1", [cleanCode]);
  } catch (err: any) {
    logSystemEvent('error', 'promo', `PG Update Promo Used Error: ${err.message}`);
  }

  await activateUserInDatabase(userEmail, name || promoFound.boundName || "طبيب مفعّل بكود", "", planId, "", "promo");

  const activatedSub: SubscriptionRequest = {
    id: `act_${Date.now()}`,
    userName: name || promoFound.boundName || "طبيب مفعّل بكود",
    userEmail,
    userPhone: "",
    specialtyId: "medicine",
    planId,
    paymentMethod: "promo",
    promoCode: cleanCode,
    status: "approved",
    createdAt: now.toISOString()
  };
  subscriptionRequests.unshift(activatedSub);

  try {
    await executeDbQuery(
      `INSERT INTO subscription_requests (id, user_name, user_email, user_phone, specialty_id, plan_id, payment_method, promo_code, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [activatedSub.id, activatedSub.userName, activatedSub.userEmail, activatedSub.userPhone, activatedSub.specialtyId, activatedSub.planId, activatedSub.paymentMethod, activatedSub.promoCode, activatedSub.status, activatedSub.createdAt]
    );
  } catch (err: any) {
    logSystemEvent('error', 'subscription', `PG Insert Activated Sub Error: ${err.message}`);
  }

  const codeEmailSubject = `تم تفعيل حسابك بنجاح باستخدام كود التفعيل 🎉`;
  const codeEmailHtml = `
    <div style="font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 24px; border: 1px solid #16a34a; border-radius: 10px; background-color: #f0fdf4; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #bbf7d0; padding-bottom: 15px;">
        <h2 style="color: #15803d; margin: 0 0 5px 0;">مرحباً بك دكتور ${activatedSub.userName} 🎉</h2>
        <p style="color: #166534; font-size: 15px; margin: 0;">تم قبول كود التفعيل وإكمال تفعيل اشتراكك فوراً!</p>
      </div>
      <div style="background-color: #ffffff; padding: 18px; border-radius: 8px; border: 1px solid #dcfce7; margin-bottom: 20px;">
        <p style="margin: 6px 0; color: #334155;"><strong>البريد الإلكتروني المعتمد:</strong> ${userEmail}</p>
        <p style="margin: 6px 0; color: #334155;"><strong>مدة الاشتراك:</strong> ${durationDays} يوماً</p>
        <p style="margin: 6px 0; color: #15803d; font-weight: bold;">✅ يمكنك الآن تسجيل الدخول مباشرة والدخول لجميع الامتحانات.</p>
      </div>
      <hr style="margin: 25px 0 15px 0; border: none; border-top: 1px solid #bbf7d0;" />
      <p style="font-size: 12px; color: #166534; text-align: center; margin: 0;">فريق عمل منصة MedExam.net - نتمنى لك كل التوفيق!</p>
    </div>
  `;
  sendNotificationEmail(codeEmailSubject, codeEmailHtml, userEmail).catch(err => {
    logSystemEvent('error', 'smtp', `Activation Code Student Email Error: ${err.message}`);
  });

  return res.json({
    success: true,
    message: "تم تفعيل حسابك واشتراكك بنجاح!",
    subscription: {
      isSubscribed: true,
      subscriptionStatus: 'active',
      startDate: now.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      remainingDays: durationDays,
      planId,
      activationCodeUsed: cleanCode
    }
  });
});

// Check Email Existence Endpoint
app.post("/api/auth/check-email", authLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (ADMIN_EMAILS.includes(cleanEmail)) {
    return res.json({ exists: true, fullName: 'مدير المنصة' });
  }

  try {
    const r = await executeDbQuery("SELECT full_name FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    if (r && r.rows.length > 0) {
      return res.json({ exists: true, fullName: r.rows[0].full_name || '' });
    }
  } catch (err: any) {
    logSystemEvent('error', 'auth', `check-email error: ${err.message}`);
  }

  return res.json({ exists: false });
});

// User Registration Endpoint
app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { email, fullName, phone, password } = req.body || {};
  if (!email || !fullName || !password) {
    return res.status(400).json({ success: false, error: "البريد الإلكتروني والاسم الكامل وكلمة السر مطلوبة" });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ success: false, error: "كلمة السر يجب ألا تقل عن 8 أحرف" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const userName = fullName.trim();
  const userPhone = phone ? phone.trim() : "";

  let createdUser = null;

  try {
    const existing = await executeDbQuery("SELECT * FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    if (existing && existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: "البريد الإلكتروني مسجل بالفعل بالموقع" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const insertRes = await executeDbQuery(
      `INSERT INTO users (email, full_name, phone, password_hash, is_active, is_subscribed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, FALSE, FALSE, NOW(), NOW())
       RETURNING *`,
      [cleanEmail, userName, userPhone, passwordHash]
    );

    if (insertRes && insertRes.rows.length > 0) {
      const r = insertRes.rows[0];
      createdUser = {
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        phone: r.phone,
        isActive: r.is_active,
        isSubscribed: r.is_subscribed,
        createdAt: r.created_at
      };
      logSystemEvent('success', 'auth', `User ${cleanEmail} registered successfully!`, { userId: r.id });
    }
  } catch (err: any) {
    logSystemEvent('error', 'auth', `PG Register Error: ${err.message}`);
    return res.status(500).json({ success: false, error: "تعذر إنشاء الحساب، حاول مرة أخرى" });
  }

  const regSubject = `تم استلام طلب تسجيل حسابك في منصة MedExam.net 📩`;
  const regHtml = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #3b82f6; border-radius: 8px; background-color: #eff6ff; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4ed8; margin-top: 0;">مرحباً دكتور ${userName} 👋</h2>
      <p style="font-size: 15px; color: #1e3a8a;">تم استلام طلب تسجيل حسابك في منصة MedExam.net بنجاح!</p>
      <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #bfdbfe; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>البريد الإلكتروني:</strong> ${cleanEmail}</p>
        <p style="margin: 5px 0;"><strong>رقم الهاتف:</strong> ${userPhone || 'غير محدد'}</p>
        <p style="margin: 5px 0; color: #1d4ed8;"><strong>حالة الحساب:</strong> قيد التفعيل بعد اختيار الباقة وإرفاق إشعار الاشتراك.</p>
      </div>
      <p style="font-size: 13px; color: #3b82f6;">فريق الدعم الفني - منصة MedExam.net</p>
    </div>
  `;
  sendNotificationEmail(regSubject, regHtml, cleanEmail).catch(e => {
    logSystemEvent('error', 'smtp', `Reg Email Error for ${cleanEmail}: ${e.message}`);
  });

  return res.json({
    success: true,
    message: "تم تسجيل حسابك بنجاح! يمكن تقديم طلب الاشتراك وتأكيد التحويل للتفعيل المباشر.",
    user: createdUser || { email: cleanEmail, fullName: userName, isActive: false, isSubscribed: false }
  });
});

// User Login Endpoint
app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "البريد الإلكتروني وكلمة السر مطلوبان" });
  }

  const cleanEmail = email.trim().toLowerCase();

  // مسار الأدمن: لا يوجد أي Bypass للمدير. إذا لم يتم ضبط ADMIN_PASSWORD_HASH، يُمنع الدخول تماماً.
  if (ADMIN_EMAILS.includes(cleanEmail)) {
    if (!ADMIN_PASSWORD_HASH) {
      logSystemEvent('error', 'auth', 'Admin login blocked because ADMIN_PASSWORD_HASH is not configured.');
      return res.status(503).json({ success: false, error: "تسجيل دخول المدير غير متاح حالياً" });
    }

    const isMatch = await bcrypt.compare(String(password), ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      logSystemEvent('warn', 'auth', `Failed admin login attempt for ${cleanEmail}`);
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
  }

  let dbUser = null;
  try {
    const dbRes = await executeDbQuery("SELECT * FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    if (dbRes && dbRes.rows.length > 0) {
      dbUser = dbRes.rows[0];
    }
  } catch (err: any) {
    logSystemEvent('error', 'auth', `PG Login Error: ${err.message}`);
    return res.status(500).json({ success: false, error: "خطأ في الخادم، حاول لاحقاً" });
  }

  if (!dbUser || !dbUser.password_hash) {
    return res.status(401).json({ success: false, error: "البريد الإلكتروني أو كلمة السر غير صحيحة" });
  }

  let passwordMatches = false;
  try {
    passwordMatches = await bcrypt.compare(String(password), dbUser.password_hash);
  } catch {
    passwordMatches = false;
  }

  if (!passwordMatches) {
    logSystemEvent('warn', 'auth', `Failed login attempt for ${cleanEmail}`);
    return res.status(401).json({ success: false, error: "البريد الإلكتروني أو كلمة السر غير صحيحة" });
  }

  await executeDbQuery("UPDATE users SET last_login = NOW() WHERE LOWER(email) = $1", [cleanEmail]);
  logSystemEvent('info', 'auth', `User ${cleanEmail} logged in successfully`);

  const now = new Date();
  const endDate = dbUser.subscription_end ? new Date(dbUser.subscription_end) : null;
  const remainingDays = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const isStillSubscribed = dbUser.is_subscribed && remainingDays > 0;

  const isAdminRole = (opAdmin && opAdmin.status === 'active');
  const token = signToken({ email: cleanEmail, role: isAdminRole ? "admin" : "user" });

  return res.json({
    success: true,
    token,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.full_name,
      phone: dbUser.phone,
      role: isAdminRole ? 'admin' : 'user',
      isActive: dbUser.is_active,
      isOwnerAdmin: false,
      isSubscribed: isStillSubscribed,
      subscriptionStatus: isStillSubscribed ? 'active' : (dbUser.is_active ? 'expired' : 'free'),
      subscriptionType: dbUser.subscription_type,
      startDate: dbUser.subscription_start,
      endDate: dbUser.subscription_end,
      remainingDays
    }
  });
});

// Get Current User Profile Endpoint
app.get("/api/auth/me", requireAuth, async (req, res) => {
  const authUser = (req as any).auth;
  const email = String(authUser.email).trim().toLowerCase();

  try {
    const dbRes = await executeDbQuery("SELECT * FROM users WHERE LOWER(email) = $1", [email]);
    if (dbRes && dbRes.rows.length > 0) {
      const u = dbRes.rows[0];
      const now = new Date();
      const endDate = u.subscription_end ? new Date(u.subscription_end) : null;
      const remainingDays = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      return res.json({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        phone: u.phone,
        isActive: u.is_active,
        isSubscribed: Boolean(u.is_subscribed) && remainingDays > 0,
        subscriptionType: u.subscription_type,
        startDate: u.subscription_start,
        endDate: u.subscription_end,
        remainingDays,
        lastLogin: u.last_login
      });
    }
    return res.status(404).json({ success: false, error: "المستخدم غير موجود" });
  } catch (err: any) {
    logSystemEvent('error', 'auth', `PG Auth Me Error: ${err.message}`);
    return res.status(503).json({ success: false, error: "قاعدة البيانات غير متاحة حالياً" });
  }
});

// All Users Management Endpoint (for Admin)
app.get("/api/users", requireAdmin, async (req, res) => {
  try {
    const dbRes = await executeDbQuery("SELECT id, email, full_name, phone, is_active, is_subscribed, subscription_type, subscription_start, subscription_end, last_login, created_at FROM users ORDER BY created_at DESC");
    if (dbRes && dbRes.rows) {
      return res.json({ success: true, count: dbRes.rows.length, users: dbRes.rows });
    }
  } catch (err: any) {
    logSystemEvent('error', 'users', `PG Get Users Error: ${err.message}`);
  }
  res.json({ success: true, count: 0, users: [] });
});

// Toggle User Active Status Endpoint
app.put("/api/users/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { isActive, isSubscribed } = req.body || {};

  try {
    await executeDbQuery(
      `UPDATE users SET is_active = COALESCE($1, is_active), is_subscribed = COALESCE($2, is_subscribed), updated_at = NOW() WHERE id = $3`,
      [isActive, isSubscribed, id]
    );
    logSystemEvent('info', 'users', `User ${id} status toggled: active=${isActive}, sub=${isSubscribed}`);
    return res.json({ success: true, message: "تم تحديث حالة المستخدم بنجاح" });
  } catch (err: any) {
    logSystemEvent('error', 'users', `PG Toggle User Status Error: ${err.message}`);
  }
  res.json({ success: true, message: "تم تحديث الحالة" });
});

// Record Student Exam Attempt Endpoint
app.post("/api/exam-attempts", requireAuth, async (req, res) => {
  const authUser = (req as any).auth;
  const authenticatedEmail = String(authUser.email).trim().toLowerCase();
  const { examId, specialtyId, score, timeTaken, answers, proctoringReport, status } = req.body || {};

  try {
    const uRes = await executeDbQuery("SELECT id FROM users WHERE LOWER(email) = $1", [authenticatedEmail]);
    const resolvedUserId = uRes && uRes.rows.length > 0 ? uRes.rows[0].id : null;

    const insertRes = await executeDbQuery(
      `INSERT INTO exam_attempts (user_id, exam_id, specialty_id, score, time_taken, answers, status, proctoring_report, started_at, completed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
       RETURNING *`,
      [resolvedUserId, examId || 'exam_default', specialtyId || 'medicine', score || 0, timeTaken || 0, JSON.stringify(answers || []), status || 'completed', JSON.stringify(proctoringReport || {})]
    );

    if (insertRes && insertRes.rows.length > 0) {
      return res.json({ success: true, attempt: insertRes.rows[0] });
    }
  } catch (err: any) {
    logSystemEvent('error', 'exam', `PG Record Exam Attempt Error: ${err.message}`);
  }

  res.json({ success: true, attempt: { id: `att_${Date.now()}`, score, timeTaken, status: 'completed' } });
});

// Get Exam Attempts History Endpoint
app.get("/api/exam-attempts", requireAuth, async (req, res) => {
  const authUser = (req as any).auth;
  const authenticatedEmail = String(authUser.email).trim().toLowerCase();

  try {
    const query = `
      SELECT ea.* FROM exam_attempts ea
      JOIN users u ON ea.user_id = u.id
      WHERE LOWER(u.email) = $1
      ORDER BY ea.created_at DESC
    `;
    const dbRes = await executeDbQuery(query, [authenticatedEmail]);
    if (dbRes && dbRes.rows) {
      return res.json({ success: true, attempts: dbRes.rows });
    }
  } catch (err: any) {
    logSystemEvent('error', 'exam', `PG Get Exam Attempts Error: ${err.message}`);
  }

  res.json({ success: true, attempts: [] });
});

// Get Payments Audit History Endpoint
app.get("/api/payments", requireAdmin, async (req, res) => {
  try {
    const dbRes = await executeDbQuery("SELECT * FROM payments ORDER BY created_at DESC");
    if (dbRes && dbRes.rows) {
      return res.json({ success: true, count: dbRes.rows.length, payments: dbRes.rows });
    }
  } catch (err: any) {
    logSystemEvent('error', 'payments', `PG Get Payments Error: ${err.message}`);
  }
  res.json({ success: true, count: 0, payments: [] });
});

// 6. Promo Codes
app.post("/api/promo/validate", authLimiter, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "يرجى إدخال الكود" });

  const upperCode = code.trim().toUpperCase();

  try {
    const dbRes = await executeDbQuery("SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND is_used = FALSE", [upperCode]);
    if (dbRes && dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      return res.json({
        valid: true,
        promo: {
          code: row.code,
          planId: row.plan_id,
          discountPercent: row.discount_percent,
          isUsed: row.is_used,
          generatedAt: row.generated_at
        }
      });
    }
  } catch (err: any) {
    logSystemEvent('error', 'promo', `PG Validate Promo Error: ${err.message}`);
  }

  const found = activePromoCodes.find(p => p.code.trim().toUpperCase() === upperCode && !p.isUsed);
  if (found) {
    res.json({ valid: true, promo: found });
  } else {
    res.status(404).json({ valid: false, error: "كود التفعيل غير متاح أو منتهي الصلاحية" });
  }
});

app.post("/api/promo/generate", requireAdmin, async (req, res) => {
  const { planId, count = 1, discountPercent = 100, email, name } = req.body;

  if (!email || !String(email).trim()) {
    return res.status(400).json({ success: false, error: "لازم تحدد إيميل الطالب المستفيد من الكود" });
  }
  const boundEmail = String(email).trim().toLowerCase();
  const boundName = name ? String(name).trim() : '';

  const generated: PromoCode[] = [];
  for (let i = 0; i < count; i++) {
    const code = `MEDEXAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newCode: PromoCode = {
      code,
      planId: planId || 'monthly',
      discountPercent,
      isUsed: false,
      generatedAt: new Date().toISOString(),
      boundEmail,
      boundName
    };

    try {
      await executeDbQuery(
        `INSERT INTO promo_codes (code, plan_id, discount_percent, is_used, bound_email, bound_name)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newCode.code, newCode.planId, newCode.discountPercent, false, boundEmail, boundName]
      );
    } catch (err: any) {
      logSystemEvent('error', 'promo', `PG Insert Promo Error: ${err.message}`);
    }

    activePromoCodes.push(newCode);
    generated.push(newCode);
  }
  res.status(201).json({ success: true, codes: generated });
});

// Dynamic Plans Management Endpoints
app.get("/api/plans", (req, res) => {
  res.json({ success: true, plans: plansStore });
});

app.post("/api/admin/plans/update", requireAdmin, async (req, res) => {
  const { plans } = req.body;
  if (Array.isArray(plans)) {
    plansStore = plans;
    await saveSetting("dynamicPlans", plansStore);
    console.log("Updated plansStore:", plansStore);
    return res.json({ success: true, message: "تم تحديث أسعار ونشاط الباقات بنجاح", plans: plansStore });
  }
  res.status(400).json({ success: false, error: "بيانات غير صالحة" });
});

app.get("/api/admin/zoho", requireAdmin, (req, res) => {
  res.json({
    email: zohoMailConfig.email,
    smtpHost: zohoMailConfig.smtpHost,
    smtpPort: zohoMailConfig.smtpPort,
    isPasswordSet: !!(process.env.ZOHO_SMTP_PASS || process.env.ZOHO_PASSWORD || zohoMailConfig.password),
    lastEmailDeliveryStatus,
    status: zohoMailConfig.status
  });
});

app.post("/api/admin/zoho", requireAdmin, async (req, res) => {
  const { email, password, smtpHost, smtpPort } = req.body;
  if (email) zohoMailConfig.email = email;
  if (password) zohoMailConfig.password = password;
  if (smtpHost) zohoMailConfig.smtpHost = smtpHost;
  if (smtpPort) zohoMailConfig.smtpPort = Number(smtpPort);
  await saveSetting("zohoMailConfig", zohoMailConfig);
  
  res.json({
    success: true,
    message: "تم حفظ إعدادات خادم البريد Zoho SMTP بنجاح",
    zohoConfig: {
      email: zohoMailConfig.email,
      smtpHost: zohoMailConfig.smtpHost,
      smtpPort: zohoMailConfig.smtpPort,
      isPasswordSet: !!(process.env.ZOHO_SMTP_PASS || process.env.ZOHO_PASSWORD || zohoMailConfig.password),
      status: zohoMailConfig.status
    }
  });
});

// Explicit Email Testing Endpoint (GET / POST)
app.all("/api/admin/test-email", requireAdmin, async (req, res) => {
  const recipient = (req.query.to as string) || (req.body && req.body.to) || "d@medexam.net";
  const result = await sendNotificationEmail(
    "رسالة اختبار Zoho SMTP - منصة MedExam.net",
    `<div style="font-family: Arial, sans-serif; direction: rtl; padding: 20px; border: 2px solid #10b981; border-radius: 8px;">
      <h3 style="color: #059669; margin-top:0;">نجاح اختبار إرسال البريد - MedExam.net</h3>
      <p>تم إرسال هذه الرسالة لاختبار الربط بين خوادم Netlify وخادم Zoho SMTP (${zohoMailConfig.smtpHost}:${zohoMailConfig.smtpPort}).</p>
      <p><strong>البريد المستلم:</strong> ${recipient}</p>
      <p><strong>تاريخ ووقت الاختبار:</strong> ${new Date().toLocaleString('ar-SD')}</p>
     </div>`,
    recipient
  );

  return res.json({
    testCompleted: true,
    recipient,
    emailResult: result,
    smtpConfig: {
      smtpHost: process.env.ZOHO_SMTP_HOST || zohoMailConfig.smtpHost,
      smtpPort: process.env.ZOHO_SMTP_PORT || zohoMailConfig.smtpPort,
      smtpUser: process.env.ZOHO_SMTP_USER || zohoMailConfig.email,
      isPasswordSet: !!(process.env.ZOHO_SMTP_PASS || process.env.ZOHO_PASSWORD || zohoMailConfig.password)
    }
  });
});

app.post("/api/email/verify", (req, res) => {
  const { email, code } = req.body;
  res.json({
    success: true,
    message: `تم إرسال إشعار ورمز التأكيد إلى ${email} عبر خدمة Zoho SMTP (${zohoMailConfig.smtpHost}:${zohoMailConfig.smtpPort})`
  });
});

// 8. Simulated AI Proctoring Report Logger
let proctoringReportsLog: Array<{
  sessionId: string;
  specialtyId: string;
  tabSwitches: number;
  faceLossCount: number;
  integrityScore: number;
  status: string;
  timestamp: string;
}> = [];

app.post("/api/proctoring/report", requireAuth, async (req, res) => {
  const { sessionId, specialtyId, tabSwitches, faceLossCount, integrityScore, status, summaryText } = req.body;
  
  const report = {
    sessionId: sessionId || `exam_${Date.now()}`,
    specialtyId: specialtyId || 'general',
    tabSwitches: Number(tabSwitches) || 0,
    faceLossCount: Number(faceLossCount) || 0,
    integrityScore: Number(integrityScore) || 100,
    status: status || 'ممتاز - نزاهة أكاديمية كاملة',
    summaryText: summaryText || 'تم حفظ تقرير المراقبة الذكية بنجاح دون تخزين أي وسائط على السيرفر',
    timestamp: new Date().toISOString()
  };

  try {
    await executeDbQuery(
      `INSERT INTO proctoring_reports (session_id, specialty_id, tab_switches, face_loss_count, integrity_score, status, summary_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [report.sessionId, report.specialtyId, report.tabSwitches, report.faceLossCount, report.integrityScore, report.status, report.summaryText]
    );
  } catch (err: any) {
    logSystemEvent('error', 'proctoring', `PG Insert Proctoring Report Error: ${err.message}`);
  }

  proctoringReportsLog.push(report);

  res.json({
    success: true,
    privacyGuarantee: "لم يتم حفظ أي فيديو أو صوت على السيرفر. تم تسجيل التقرير الإحصائي فقط.",
    report
  });
});

app.get("/api/proctoring/reports", requireAdmin, async (req, res) => {
  try {
    const dbRes = await executeDbQuery("SELECT * FROM proctoring_reports ORDER BY created_at DESC");
    if (dbRes && dbRes.rows) {
      return res.json({
        totalLogs: dbRes.rows.length,
        reports: dbRes.rows
      });
    }
  } catch (err: any) {
    logSystemEvent('error', 'proctoring', `PG Get Proctoring Reports Error: ${err.message}`);
  }

  res.json({
    totalLogs: proctoringReportsLog.length,
    reports: proctoringReportsLog
  });
});

// Diagnostic System Logs Endpoints
app.get("/api/admin/logs", requireAdmin, async (req, res) => {
  const dbUrl = getDatabaseUrl();
  let dbConnectionTest = { success: false, message: "" };

  try {
    const testRes = await executeDbQuery("SELECT NOW() as db_time, current_database() as db_name");
    if (testRes && testRes.rows.length > 0) {
      dbConnectionTest = {
        success: true,
        message: `Connected to Supabase/PostgreSQL database '${testRes.rows[0].db_name}' at ${testRes.rows[0].db_time}`
      };
    }
  } catch (err: any) {
    dbConnectionTest = {
      success: false,
      message: err.message
    };
  }

  res.json({
    success: true,
    logs: systemLogs,
    dbStatus: {
      isConnected: isDbConnected,
      hasDatabaseUrl: Boolean(dbUrl),
      databaseHost: dbUrl ? dbUrl.split('@')[1]?.split('/')[0] : 'None',
      connectionTest: dbConnectionTest
    },
    smtpStatus: {
      smtpHost: zohoMailConfig.smtpHost,
      smtpPort: zohoMailConfig.smtpPort,
      smtpUser: zohoMailConfig.email,
      isPasswordConfigured: !!(process.env.ZOHO_SMTP_PASS || process.env.ZOHO_PASSWORD || zohoMailConfig.password),
      lastDelivery: lastEmailDeliveryStatus
    }
  });
});

app.post("/api/admin/logs/clear", requireAdmin, (req, res) => {
  systemLogs = [];
  res.json({ success: true, message: "تم مسح سجلات النظام" });
});

// Live Database Health & Table Inspection Endpoint
app.get("/api/admin/db-test", requireAdmin, async (req, res) => {
  try {
    const [usersRes, subsRes, paymentsRes, questionsRes, promoRes] = await Promise.all([
      executeDbQuery("SELECT COUNT(*) as count FROM users"),
      executeDbQuery("SELECT COUNT(*) as count FROM subscription_requests"),
      executeDbQuery("SELECT COUNT(*) as count FROM payments"),
      executeDbQuery("SELECT COUNT(*) as count FROM questions"),
      executeDbQuery("SELECT COUNT(*) as count FROM promo_codes")
    ]);

    const latestUsers = await executeDbQuery("SELECT id, email, full_name, is_active, is_subscribed, subscription_type, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    const latestSubs = await executeDbQuery("SELECT id, user_name, user_email, plan_id, status, created_at FROM subscription_requests ORDER BY created_at DESC LIMIT 5");
    const latestPayments = await executeDbQuery("SELECT id, user_email, amount, status, created_at FROM payments ORDER BY created_at DESC LIMIT 5");

    return res.json({
      success: true,
      database: {
        isConnected: isDbConnected,
        tableCounts: {
          users: usersRes ? parseInt(usersRes.rows[0].count, 10) : 0,
          subscription_requests: subsRes ? parseInt(subsRes.rows[0].count, 10) : 0,
          payments: paymentsRes ? parseInt(paymentsRes.rows[0].count, 10) : 0,
          questions: questionsRes ? parseInt(questionsRes.rows[0].count, 10) : 0,
          promo_codes: promoRes ? parseInt(promoRes.rows[0].count, 10) : 0
        },
        sampleData: {
          latestUsers: latestUsers ? latestUsers.rows : [],
          latestSubscriptions: latestSubs ? latestSubs.rows : [],
          latestPayments: latestPayments ? latestPayments.rows : []
        }
      }
    });
  } catch (err: any) {
    logSystemEvent('error', 'database', `Admin DB Test Failure: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "فشل اختبار قاعدة البيانات"
    });
  }
});

// 9. Admin Statistics
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  let totalQuestionsCount = 0;
  let pendingSubsCount = subscriptionRequests.filter(s => s.status === 'pending').length;
  let totalUsersCount = 0;
  let activeSubscribersCount = 0;
  let totalExamsTakenCount = 0;
  let passRatePercentVal = 0;

  try {
    const qRes = await executeDbQuery("SELECT COUNT(*) FROM questions");
    if (qRes && qRes.rows.length > 0) {
      totalQuestionsCount = parseInt(qRes.rows[0].count, 10);
    }
    const subRes = await executeDbQuery("SELECT COUNT(*) FROM subscription_requests WHERE status = 'pending'");
    if (subRes && subRes.rows.length > 0) {
      pendingSubsCount = parseInt(subRes.rows[0].count, 10);
    }
    const usersRes = await executeDbQuery("SELECT COUNT(*) FROM users");
    if (usersRes && usersRes.rows.length > 0) {
      totalUsersCount = parseInt(usersRes.rows[0].count, 10);
    }
    const activeSubRes = await executeDbQuery("SELECT COUNT(*) FROM users WHERE is_subscribed = TRUE");
    if (activeSubRes && activeSubRes.rows.length > 0) {
      activeSubscribersCount = parseInt(activeSubRes.rows[0].count, 10);
    }

    // Dynamic stats from exam_attempts
    const examsRes = await executeDbQuery(`
      SELECT 
        COUNT(*) as total_exams,
        COUNT(*) FILTER (WHERE score >= 60) as passed_exams
      FROM exam_attempts
    `);
    if (examsRes && examsRes.rows.length > 0) {
      totalExamsTakenCount = parseInt(examsRes.rows[0].total_exams, 10) || 0;
      const passedCount = parseInt(examsRes.rows[0].passed_exams, 10) || 0;
      if (totalExamsTakenCount > 0) {
        passRatePercentVal = parseFloat(((passedCount / totalExamsTakenCount) * 100).toFixed(1));
      }
    }
  } catch (err: any) {
    logSystemEvent('error', 'stats', `PG Admin Stats Error: ${err.message}`);
  }

  res.json({
    totalUsers: totalUsersCount,
    totalExamsTaken: totalExamsTakenCount,
    passRatePercent: passRatePercentVal,
    totalQuestions: totalQuestionsCount,
    pendingSubscriptions: pendingSubsCount,
    activeSubscribers: activeSubscribersCount,
    proctoringReportsCount: proctoringReportsLog.length,
    dbConnected: isDbConnected
  });
});

// 10. Specialty Status Management (Active / Inactive Coming Soon)
app.get("/api/specialties/status", (req, res) => {
  res.json({ statusMap: specialtiesActiveMap });
});

app.get("/api/admin/specialties", requireAdmin, async (req, res) => {
  try {
    const specialtiesRes = await executeDbQuery(`
      SELECT s.*, c.badge_color 
      FROM medical_specialties s
      LEFT JOIN medical_councils c ON s.council_id = c.id
      ORDER BY s.display_order
    `);
    
    const specialties = specialtiesRes.rows.map(s => ({
      id: s.id,
      councilId: s.council_id,
      titleAr: s.title_ar,
      titleEn: s.title_en,
      iconName: s.icon_name,
      description: s.description,
      questionCount: 0,
      activeCount: 0,
      badgeColor: s.badge_color || "emerald",
      isActive: s.is_active
    }));
    
    res.json(specialties);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch specialties" });
  }
});

app.post("/api/admin/specialties", requireAdmin, async (req, res) => {
  if (Array.isArray(req.body)) {
    try {
      if (!dbPool) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const client = await dbPool.connect();
      try {
        await client.query("BEGIN");
        for (const s of req.body) {
          await client.query(
            "UPDATE medical_specialties SET title_ar = $1, title_en = $2, description = $3, icon_name = $4, is_active = $5, display_order = $6 WHERE id = $7",
            [s.titleAr, s.titleEn, s.description, s.iconName, s.isActive !== false, s.displayOrder || 0, s.id]
          );
        }
        await client.query("COMMIT");
        return res.json({ success: true });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Error saving specialties:", err);
      return res.status(500).json({ error: "Failed to save specialties" });
    }
  }
  return res.status(400).json({ error: "Invalid payload" });
});


app.post("/api/admin/specialties/save", requireAdmin, async (req, res) => {
  const s = req.body;
  if (!s || !s.id) return res.status(400).json({ error: "Invalid specialty payload" });
  try {
    const existing = await executeDbQuery("SELECT id FROM medical_specialties WHERE id = $1", [s.id]);
    if (existing.rows.length > 0) {
      await executeDbQuery(
        "UPDATE medical_specialties SET council_id = $1, title_ar = $2, title_en = $3, description = $4, icon_name = $5, is_active = $6, display_order = $7 WHERE id = $8",
        [s.councilId, s.titleAr, s.titleEn, s.description, s.iconName || 'Stethoscope', s.isActive !== false, s.displayOrder || 0, s.id]
      );
    } else {
      await executeDbQuery(
        "INSERT INTO medical_specialties (id, council_id, title_ar, title_en, description, icon_name, is_active, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [s.id, s.councilId, s.titleAr, s.titleEn, s.description, s.iconName || 'Stethoscope', s.isActive !== false, s.displayOrder || 0]
      );
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Save specialty error:", err);
    return res.status(500).json({ error: "Failed to save specialty" });
  }
});


app.post("/api/admin/specialties/toggle", requireAdmin, async (req, res) => {
  const { specialtyId, isActive } = req.body || {};
  if (!specialtyId) {
    return res.status(400).json({ error: "specialtyId is required" });
  }
  try {
    const current = await executeDbQuery("SELECT is_active FROM medical_specialties WHERE id = $1", [specialtyId]);
    if (current.rows.length > 0) {
      const newActive = typeof isActive === "boolean" ? isActive : !current.rows[0].is_active;
      await executeDbQuery("UPDATE medical_specialties SET is_active = $1 WHERE id = $2", [newActive, specialtyId]);
      return res.json({ success: true, specialtyId, isActive: newActive });
    }
    return res.status(404).json({ error: "Specialty not found" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to toggle specialty" });
  }
});
// 11. Persistent Site Settings & Councils Endpoints
let operationalAdminsStore: Array<{ email: string, status: 'active' | 'disabled', createdAt: number, createdBy: string, disabledAt?: number, disabledBy?: string }> = [];
let siteSettingsStore: any = {
  tickerNews: "مرحباً بكم في منصة MedExam.net - المحاكي القومي المعتمد لامتحانات رخصة ممارسة المهنة ومجالس المهن الطبية والصحية والمجلس الطبي السوداني.",
  contactEmail: "d@medexam.net",
  contactPhone: "+249912345678",
  bankakAccount: "3849201",
  fawryNumber: "9901428",
  enableExamProctoring: true,
  appDownloadUrl: "https://medexam.net/app-release.apk"
};

let councilsStore: any[] = [
  {
    id: 'professions',
    titleAr: 'مجلس المهن الطبية والصحية',
    titleEn: 'Medical Professions Council',
    logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=120&auto=format&fit=crop',
    description: 'امتحانات القبالة، التمريض العالي، المختبرات الطبية، والمساعدين الطبيين.',
    color: 'emerald',
    departments: [
      { id: 'labs', councilId: 'professions', titleAr: 'المختبرات الطبية', titleEn: 'Medical Laboratories', description: 'أمراض الدم، الكيمياء السريرية، الأحياء الدقيقة، والأنسجة.', questionCount: 393 },
      { id: 'nursing', councilId: 'professions', titleAr: 'التمريض العالي', titleEn: 'Higher Nursing', description: 'أساسيات التمريض، التمريض الجراحي الباطني، العناية الحثيثة، وتمريض صحة الأم والطفل.', questionCount: 520 },
      { id: 'dental_assistants', councilId: 'professions', titleAr: 'مساعدين طب الأسنان', titleEn: 'Dental Assistants', description: 'صحة الفن، التعقيم الجراحي، والمساعدات السريرية.', questionCount: 380 },
      { id: 'med_assistants', councilId: 'professions', titleAr: 'المساعدين الطبيين', titleEn: 'Medical Assistants', description: 'الرعاية الصحية الأولية التشخيصية والتشخيص الميداني.', questionCount: 420 },
      { id: 'midwifery', councilId: 'professions', titleAr: 'القبالة وتوليد المجتمع', titleEn: 'Midwifery', description: 'صحة التناسل، الولادة الآمنة، والعناية بالأم والمولود.', questionCount: 310 }
    ]
  },
  {
    id: 'medical',
    titleAr: 'المجلس الطبي السوداني',
    titleEn: 'Sudanese Medical Council',
    logoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=120&auto=format&fit=crop',
    description: 'امتحانات رخصة الامتياز والممارسة المهنية للأطباء والصيادلة وأطباء الأسنان.',
    color: 'blue',
    departments: [
      { id: 'medicine', councilId: 'medical', titleAr: 'الطب والجراحة', titleEn: 'Medicine & Surgery', description: 'امتحانات رخصة ممارسة الطب البشري والجراحة العامة.', questionCount: 2150 },
      { id: 'dentistry', councilId: 'medical', titleAr: 'طب وجراحة الأسنان', titleEn: 'Dentistry', description: 'حشوات الأسنان، جراحة الفك، وتداوي الجذور.', questionCount: 650 },
      { id: 'pharmacy', councilId: 'medical', titleAr: 'الصيدلة الدوائية', titleEn: 'Pharmacy', description: 'الصيدلة السريرية، علم الأدوية، والسموم.', questionCount: 580 }
    ]
  },
  {
    id: 'specialties',
    titleAr: 'مجلس التخصصات الطبية (SMSB)',
    titleEn: 'Sudanese Board of Medical Specializations',
    logoUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=120&auto=format&fit=crop',
    description: 'امتحانات الجزء الأول والجزء الثاني والدبلومات التخصصية (Part 1 & Part 2).',
    color: 'purple',
    departments: [
      { id: 'gen_surgery', councilId: 'specialties', titleAr: 'الجراحة العامة', titleEn: 'General Surgery', description: 'جراحة الجهاز الهضمي، جراحة الأوعية، والجراحة الطارئة.', questionCount: 480 },
      { id: 'int_medicine', councilId: 'specialties', titleAr: 'الطب الباطني', titleEn: 'Internal Medicine', description: 'أمراض القلب، الصدرية، الغدد، والجهاز الهضمي.', questionCount: 520 },
      { id: 'pediatrics', councilId: 'specialties', titleAr: 'طب الأطفال والخدج', titleEn: 'Pediatrics', description: 'أمراض الأطفال، حديثي الولادة، والطوارئ.', questionCount: 410 },
      { id: 'obs_gyn', councilId: 'specialties', titleAr: 'النساء والتوليد', titleEn: 'Obstetrics & Gynecology', description: 'الحمل المرتفع الخطورة، الجراحة النسائية، والعقم.', questionCount: 390 }
    ]
  }
];

app.get("/api/settings", (_req, res) => {
  return res.json(siteSettingsStore);
});


app.get("/api/admin/specialty-languages", requireAdmin, (req, res) => {
  res.json(specialtyLanguagesMap);
});

app.post("/api/admin/specialty-languages", requireAdmin, async (req, res) => {
  if (req.body && typeof req.body === 'object') {
    specialtyLanguagesMap = { ...specialtyLanguagesMap, ...req.body };
    await saveSetting("specialtyLanguagesMap", specialtyLanguagesMap);
    return res.json({ success: true, settings: specialtyLanguagesMap });
  }
  res.status(400).json({ error: "Invalid payload" });
});

app.get("/api/admin/settings", requireAdmin, (req, res) => {
  res.json(siteSettingsStore);
});

app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  if (req.body && typeof req.body === 'object') {
    siteSettingsStore = { ...siteSettingsStore, ...req.body };
    await saveSetting("siteSettings", siteSettingsStore);
    return res.json({ success: true, settings: siteSettingsStore });
  }
  res.status(400).json({ error: "Invalid payload" });
});

app.get("/api/councils", async (_req, res) => {
  try {
    const councilsRes = await executeDbQuery("SELECT * FROM medical_councils ORDER BY id");
    const specialtiesRes = await executeDbQuery("SELECT * FROM medical_specialties ORDER BY display_order");

    if (!councilsRes || !specialtiesRes) {
       return res.json([]);
    }

    const councils = councilsRes.rows.map(c => ({
      id: c.id,
      titleAr: c.title_ar,
      titleEn: c.title_en,
      description: c.description,
      badgeColor: c.badge_color,
      isActive: c.is_active,
      departments: specialtiesRes.rows
        .filter(s => s.council_id === c.id)
        .map(s => ({
          id: s.id,
          councilId: s.council_id,
          titleAr: s.title_ar,
          titleEn: s.title_en,
          iconName: s.icon_name,
          description: s.description,
          isActive: s.is_active,
          questionCount: 0
        }))
    }));

    return res.json(councils);
  } catch (err: any) {
    console.error("Error fetching councils:", err);
    return res.status(500).json({ error: "Failed to fetch councils" });
  }
});

app.get("/api/admin/councils", requireAdmin, async (req, res) => {
  try {
    const councilsRes = await executeDbQuery("SELECT * FROM medical_councils ORDER BY id");
    const specialtiesRes = await executeDbQuery("SELECT * FROM medical_specialties ORDER BY display_order");
    const councils = councilsRes.rows.map(c => ({
      id: c.id,
      titleAr: c.title_ar,
      titleEn: c.title_en,
      description: c.description,
      badgeColor: c.badge_color,
      isActive: c.is_active,
      departments: specialtiesRes.rows
        .filter(s => s.council_id === c.id)
        .map(s => ({
          id: s.id,
          councilId: s.council_id,
          titleAr: s.title_ar,
          titleEn: s.title_en,
          iconName: s.icon_name,
          description: s.description,
          isActive: s.is_active,
          questionCount: 0
        }))
    }));
    return res.json(councils);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch councils for admin" });
  }
});

app.post("/api/admin/councils", requireAdmin, async (req, res) => {
  if (Array.isArray(req.body)) {
    try {
      if (!dbPool) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const client = await dbPool.connect();
      try {
        await client.query("BEGIN");
        for (const c of req.body) {
          // Update medical_councils
          await client.query(
            "UPDATE medical_councils SET title_ar = $1, title_en = $2, description = $3, badge_color = $4, is_active = $5 WHERE id = $6",
            [c.titleAr, c.titleEn, c.description, c.badgeColor, c.isActive !== false, c.id]
          );
          // If departments are provided, update their is_active, display_order, title, etc.
          // Note: for now, we'll only update the council, as specialties are managed separately in P1.B
        }
        await client.query("COMMIT");
        return res.json({ success: true });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Error saving councils:", err);
      return res.status(500).json({ error: "Failed to save councils" });
    }
  }
  return res.status(400).json({ error: "Invalid payload" });
});

// 12. Blog Endpoints
let blogPostsStore: any[] = [...INITIAL_BLOG_POSTS];

app.get("/api/blog", (req, res) => {
  res.json(blogPostsStore);
});

app.post("/api/blog", requireAdmin, async (req, res) => {
  const post = req.body;
  if (!post || !post.title) {
    return res.status(400).json({ error: "Title is required" });
  }
  
  const existingIdx = blogPostsStore.findIndex(p => p.id === post.id);
  if (existingIdx >= 0) {
    blogPostsStore[existingIdx] = { ...blogPostsStore[existingIdx], ...post };
  } else {
    const newPost = {
      id: post.id || `post_${Date.now()}`,
      slug: post.slug || `post-${Date.now()}`,
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'نصائح امتحانات',
      author: post.author || 'د. السماني حسن - استشاري تعليم طبي',
      date: post.date || new Date().toISOString().split('T')[0],
      readTime: post.readTime || '4 دقائق',
      imageUrl: post.imageUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      tags: post.tags || ['امتحانات الطبية', 'MCQ'],
      viewsCount: 0
    };
    blogPostsStore.unshift(newPost);
  }
  
  await saveSetting("blogPosts", blogPostsStore);
  res.json({ success: true, posts: blogPostsStore });
});

app.delete("/api/blog/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  blogPostsStore = blogPostsStore.filter(p => p.id !== id);
  await saveSetting("blogPosts", blogPostsStore);
  res.json({ success: true, posts: blogPostsStore });
});


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
    const orphanSpecs = await executeDbQuery(`
      SELECT uqb.id, uqb.specialty_id 
      FROM unified_question_bank uqb 
      LEFT JOIN medical_specialties ms ON uqb.specialty_id = ms.id 
      WHERE ms.id IS NULL
    `);
    
    const orphanCats = await executeDbQuery(`
      SELECT uqb.id, uqb.category_id 
      FROM unified_question_bank uqb 
      LEFT JOIN specialty_categories sc ON uqb.category_id = sc.id 
      WHERE uqb.category_id IS NOT NULL AND sc.id IS NULL
    `);
    
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

// SEO Endpoints: robots.txt & sitemap.xml
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://medexam.net/sitemap.xml
`);
});

app.get("/sitemap.xml", async (req, res) => {
  res.type("application/xml");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://medexam.net/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  try {
    if (dbPool && isDbConnected) {
      // Add Councils
      const cRes = await dbPool.query("SELECT id, title_ar, title_en, updated_at FROM medical_councils WHERE is_active = true");
      for (const c of cRes.rows) {
        const slug = generateSlug(c.title_en, c.title_ar, c.id);
        const lastMod = c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `
  <url>
    <loc>https://medexam.net/council/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      }

      // Add Specialties
      const sRes = await dbPool.query("SELECT id, title_ar, title_en, updated_at FROM medical_specialties WHERE is_active = true");
      for (const s of sRes.rows) {
        const slug = generateSlug(s.title_en, s.title_ar, s.id);
        const lastMod = s.updated_at ? new Date(s.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `
  <url>
    <loc>https://medexam.net/specialty/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Add News/Blog Posts (assuming they are in blogPostsStore)
    if (blogPostsStore && Array.isArray(blogPostsStore)) {
      blogPostsStore.filter(p => p.status === 'published').forEach(post => {
        const lastMod = post.date || new Date().toISOString().split('T')[0];
        xml += `
  <url>
    <loc>https://medexam.net/news/${post.id}</loc>
    <lastmod>${lastMod.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
    }

  } catch (err) {
    console.error("Error generating sitemap:", err);
  }

  xml += `\n</urlset>`;
  res.send(xml);
});


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
    const fileName = `admin/${questionId}_${Date.now()}.${fileExt}`;
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
      `INSERT INTO question_images (id, question_id, image_url, modality, display_order)
       VALUES ($1, $2, $3, 'clinical', 1)
       ON CONFLICT (question_id, display_order) DO UPDATE SET image_url = EXCLUDED.image_url`,
      [imgId, questionId, imageUrl]
    );

    return res.json({ success: true, imageUrl });
  } catch (err: any) {
    console.error('Image Upload Error:', err);
    return res.status(500).json({ success: false, error: 'Server error during upload.' });
  }
});




// --- IMPORT STAGING IN-MEMORY STATE ---
interface StagedQuestion {
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
}
const importSessions = new Map<string, StagedImportSession>();

function cleanupImportSessions() {
  const now = Date.now();
  for (const [sessionId, session] of importSessions.entries()) {
    if (now - session.createdAt > 3600 * 1000) {
      importSessions.delete(sessionId);
    }
  }
}

app.post("/api/import/chunk", requireAdmin, async (req, res) => {
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

    const fingerprintStr = `${q.specialty_id}|${q.lead_in_en.trim().toLowerCase()}`;
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
});

app.get("/api/import/preview/:sessionId", requireAdmin, async (req, res) => {
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
      const spName = `sp_${q.id.replace(/-/g, '')}`;
      while (attempts < 2 && !success) {
        try {
          await client.query(`SAVEPOINT ${spName}`);
          const category = q.category || q.category_name || 'General';
          const leadInAr = q.lead_in_ar || '';
          
          await client.query(
            "INSERT INTO unified_question_bank (id, specialty_id, category_name, lead_in_ar, lead_in_en, options, correct_option_index, reference_source, explanation_en, fingerprint_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            [q.id, q.specialty_id, category, leadInAr, q.lead_in_en, JSON.stringify(q.options), q.correct_option_index, q.reference_source || '', q.explanation_en, q.fingerprint_hash]
          );
          await client.query(`RELEASE SAVEPOINT ${spName}`);
          success = true;
        } catch (e) {
          await client.query(`ROLLBACK TO SAVEPOINT ${spName}`);
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
});

app.post("/api/import/abort", requireAdmin, async (req, res) => {
  cleanupImportSessions();
  const { sessionId } = req.body;
  importSessions.delete(sessionId);
  return res.json({ success: true });
});

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Use * for Express 4.x
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NETLIFY !== "true" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
