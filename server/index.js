import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REGISTRY_FILE = path.join(__dirname, 'citizenRegistry.json');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Load / Persist Citizen Registry ─────────────────────────────────
function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      return data.citizens || {};
    }
  } catch (err) {
    console.error('⚠️ Could not read citizenRegistry.json, using defaults:', err.message);
  }
  return {
    '882145214521': { name: 'Rahul Sharma', email: 'rahul@cdac.in' },
    '992011231123': { name: 'Priya Patel', email: 'priya@cdac.in' },
    '445188908890': { name: 'Amit Kumar', email: 'amit@cdac.in' },
    '671233493349': { name: 'Sunita Rao', email: 'sunita@cdac.in' },
  };
}

function saveRegistry(citizens) {
  try {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify({ citizens }, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Failed to save citizenRegistry.json:', err.message);
  }
}

let citizenMap = loadRegistry();

// ─── In-memory OTP Store { aadhar: { otp, email, name, expiresAt } } ─
const otpStore = new Map();

// ─── Nodemailer Transporter Setup ────────────────────────────────────
const isSmtpConfigured = Boolean(
  process.env.SMTP_USER &&
  process.env.SMTP_USER !== 'your-email@gmail.com' &&
  process.env.SMTP_PASS &&
  process.env.SMTP_PASS !== 'your-16-char-app-password'
);

let transporter = null;
const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'noreply@propchain.gov.in';
const senderName = process.env.SENDER_NAME || 'PropChain Land Registry';

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log(`📧 Nodemailer SMTP Transporter configured for user: ${process.env.SMTP_USER}`);
} else {
  console.log('ℹ️ Nodemailer SMTP credentials not configured in server/.env — running in test/demo mode.');
}

// ─── Helpers ─────────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 3) return user[0] + '***@' + domain;
  return user.slice(0, 2) + '***' + user.slice(-1) + '@' + domain;
}

function normalizeAadhar(raw) {
  return (raw || '').replace(/[\s\-]/g, '');
}

// ═══════════════════════════════════════════════════════════════════════
//  POST /api/auth/send-otp
//  Body: { aadharNumber: "882145214521" }
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const aadhar = normalizeAadhar(req.body.aadharNumber);

    if (!/^\d{12}$/.test(aadhar)) {
      return res.status(400).json({ error: 'Please enter a valid 12-digit Aadhar number.' });
    }

    const citizen = citizenMap[aadhar];
    if (!citizen) {
      return res.status(404).json({
        error: 'Aadhar number not found in citizen records. Please register first or use a demo Aadhar.',
      });
    }

    // Generate 6-digit OTP (valid 5 minutes)
    const otp = generateOTP();
    otpStore.set(aadhar, {
      otp,
      email: citizen.email,
      name: citizen.name,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log(`\n🔑 [OTP Generated] Citizen: ${citizen.name} | Aadhar: ${aadhar} | OTP: ${otp} | Email: ${citizen.email}`);

    // If SMTP is configured, attempt real email delivery via Nodemailer
    let emailSent = false;
    let emailError = null;

    if (isSmtpConfigured && transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: citizen.email,
          subject: 'PropChain Land Registry — Your Login OTP',
          html: `
            <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;padding:12px;background:#eff6ff;border-radius:12px;margin-bottom:8px;">
                  <span style="font-size:28px;">🏛️</span>
                </div>
                <h2 style="color:#0f172a;font-size:22px;margin:0;font-weight:700;">PropChain National Land Registry</h2>
                <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Secure Citizen Authentication Portal</p>
              </div>

              <div style="background:#ffffff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
                <p style="color:#334155;font-size:15px;margin:0 0 12px;">Hello <strong>${citizen.name}</strong>,</p>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
                  You requested a One-Time Password (OTP) to log in to the PropChain Land Registry portal using your registered Aadhar.
                </p>

                <div style="text-align:center;margin:28px 0;background:#eff6ff;border:2px dashed #3b82f6;border-radius:12px;padding:16px;">
                  <div style="color:#1d4ed8;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Your 6-Digit OTP</div>
                  <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#1e40af;font-family:monospace;">
                    ${otp}
                  </div>
                </div>

                <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0 0 8px;">
                  ⏱️ This code is valid for <strong>5 minutes</strong>. Do not share this OTP with anyone, including land registry officials.
                </p>
              </div>

              <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;">
                Secured by NBF-Lite Hyperledger Fabric Network &bull; Automated System
              </div>
            </div>
          `,
        });

        emailSent = true;
        console.log(`✅ [Nodemailer] Real email successfully delivered to ${citizen.email} (Message ID: ${info.messageId})`);
      } catch (err) {
        emailError = err.message || 'Unknown SMTP error';
        console.warn(`⚠️ [Nodemailer Failed] Could not deliver email: ${emailError}`);
      }
    }

    return res.json({
      success: true,
      maskedEmail: maskEmail(citizen.email),
      citizenName: citizen.name,
      emailSent,
      // If SMTP is not configured or delivery fails, include devOtp so testing is instant
      devOtp: !emailSent ? otp : undefined,
      message: emailSent
        ? `OTP sent successfully to your registered email ${maskEmail(citizen.email)}.`
        : `OTP generated for ${maskEmail(citizen.email)} (Available in test/dev mode).`,
    });
  } catch (err) {
    console.error('❌ Server error in /api/auth/send-otp:', err);
    return res.status(500).json({ error: 'Failed to process OTP request. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  POST /api/auth/verify-otp
//  Body: { aadharNumber: "882145214521", otp: "123456" }
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const aadhar = normalizeAadhar(req.body.aadharNumber);
    const { otp } = req.body;

    if (!aadhar || !otp) {
      return res.status(400).json({ error: 'Aadhar number and OTP are required.' });
    }

    const record = otpStore.get(aadhar);
    if (!record) {
      return res.status(400).json({
        error: 'No active OTP request found for this Aadhar. Please request a new OTP.',
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(aadhar);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Incorrect OTP. Please check and try again.' });
    }

    // Valid OTP — consume it
    otpStore.delete(aadhar);
    console.log(`🎉 [OTP Verified] ${record.name} logged in successfully via Aadhar ${aadhar}`);

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      citizenName: record.name,
      citizenEmail: record.email,
    });
  } catch (err) {
    console.error('❌ Error in /api/auth/verify-otp:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  POST /api/auth/register-citizen
//  Body: { aadharNumber: "...", name: "...", email: "..." }
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/auth/register-citizen', (req, res) => {
  try {
    const { aadharNumber, name, email } = req.body;
    const aadhar = normalizeAadhar(aadharNumber);

    if (!/^\d{12}$/.test(aadhar)) {
      return res.status(400).json({ error: 'Valid 12-digit Aadhar is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    citizenMap[aadhar] = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };
    saveRegistry(citizenMap);

    console.log(`📝 [Citizen Registered] Aadhar: ${aadhar} -> ${name} (${email})`);

    return res.json({
      success: true,
      message: 'Citizen Aadhar mapped successfully.',
      aadhar,
    });
  } catch (err) {
    console.error('❌ Error registering citizen:', err);
    return res.status(500).json({ error: 'Failed to register citizen mapping.' });
  }
});

// ─── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Nodemailer',
    smtpConfigured: isSmtpConfigured,
    smtpUser: process.env.SMTP_USER || null,
    totalCitizens: Object.keys(citizenMap).length,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================================`);
    console.log(`🚀 PropChain OTP Authentication Server (Nodemailer)`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📧 SMTP Email: ${isSmtpConfigured ? 'CONNECTED (' + process.env.SMTP_USER + ')' : 'STANDBY (Demo Mode)'}`);
    console.log(`👥 Registered Citizens: ${Object.keys(citizenMap).length}`);
    console.log(`========================================================\n`);
  });
}

export default app;
export { app };
