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

// Ensure env variables from server/.env and root app/.env are both loaded
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

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
    let current = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      } catch (e) {}
    }
    current.citizens = citizens;
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Failed to save citizenRegistry.json:', err.message);
  }
}

function loadProperties() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      return data.properties || [];
    }
  } catch (err) {
    console.error('⚠️ Could not read properties from citizenRegistry.json:', err.message);
  }
  return [];
}

let citizenMap = loadRegistry();

// ─── In-memory OTP Store { aadhar: { otp, email, name, expiresAt } } ─
const otpStore = new Map();
const registerOtpStore = new Map();

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

// ─── Stripe Payment Gateway Setup ────────────────────────────────────
const stripeApiKey = (process.env.STRIPE_API_KEY || '').trim();
const stripeWebhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const frontendBaseUrl = (process.env.APP_FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/$/, '');

const isStripeConfigured = Boolean(
  stripeApiKey &&
  stripeApiKey.startsWith('sk_')
);

if (isStripeConfigured) {
  console.log(`💳 Stripe Payment Gateway configured with key: ${stripeApiKey.slice(0, 14)}...`);
} else {
  console.log('ℹ️ Stripe API key not configured in .env (add STRIPE_API_KEY to enable Stripe redirection).');
}

async function stripeApiRequest(endpoint, method = 'GET', bodyParams = null) {
  if (!isStripeConfigured) {
    throw new Error('Stripe API key is not configured in .env. Please check STRIPE_API_KEY.');
  }

  const url = `https://api.stripe.com/v1${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${stripeApiKey}`,
  };

  const options = {
    method,
    headers,
  };

  if (bodyParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = bodyParams.toString();
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Stripe request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.stripeError = data?.error;
    err.status = response.status;
    throw err;
  }

  return data;
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
//  POST /api/auth/send-register-otp
//  Body: { aadharNumber: "...", email: "...", name: "..." }
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/auth/send-register-otp', async (req, res) => {
  try {
    const aadhar = normalizeAadhar(req.body.aadharNumber);
    const { email, name } = req.body;

    if (!/^\d{12}$/.test(aadhar)) {
      return res.status(400).json({ error: 'Please enter a valid 12-digit Aadhar number.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Check if Aadhar is already registered
    if (citizenMap[aadhar]) {
      return res.status(400).json({
        error: `This Aadhar number is already registered for ${citizenMap[aadhar].name}. Please sign in with Aadhar OTP.`,
      });
    }

    const citizenName = name?.trim() || 'Citizen';
    const targetEmail = email.trim().toLowerCase();
    const formattedAadhar = aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');

    // Generate 6-digit OTP (valid 5 minutes)
    const otp = generateOTP();
    registerOtpStore.set(aadhar, {
      otp,
      email: targetEmail,
      name: citizenName,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log(`\n🔑 [Registration OTP Generated] Citizen: ${citizenName} | Aadhar: ${aadhar} | OTP: ${otp} | Email: ${targetEmail}`);

    let emailSent = false;
    let emailError = null;

    if (isSmtpConfigured && transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: targetEmail,
          subject: 'PropChain Land Registry — Citizen Registration OTP',
          html: `
            <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;padding:12px;background:#eff6ff;border-radius:12px;margin-bottom:8px;">
                  <span style="font-size:28px;">🏛️</span>
                </div>
                <h2 style="color:#0f172a;font-size:22px;margin:0;font-weight:700;">PropChain National Land Registry</h2>
                <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Secure Citizen Registration Portal</p>
              </div>

              <div style="background:#ffffff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
                <p style="color:#334155;font-size:15px;margin:0 0 12px;">Hello <strong>${citizenName}</strong>,</p>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
                  You requested to register a new citizen account on the PropChain Land Registry portal linked to Aadhar <strong>${formattedAadhar}</strong>.
                </p>

                <div style="text-align:center;margin:28px 0;background:#eff6ff;border:2px dashed #3b82f6;border-radius:12px;padding:16px;">
                  <div style="color:#1d4ed8;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Your 6-Digit Registration OTP</div>
                  <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#1e40af;font-family:monospace;">
                    ${otp}
                  </div>
                </div>

                <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0 0 8px;">
                  ⏱️ This code is valid for <strong>5 minutes</strong>. Enter this code to verify your email and complete your registration.
                </p>
              </div>

              <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;">
                Secured by NBF-Lite Hyperledger Fabric Network &bull; Automated System
              </div>
            </div>
          `,
        });
        emailSent = true;
        console.log(`✅ [Nodemailer] Registration OTP delivered to ${targetEmail} (Message ID: ${info.messageId})`);
      } catch (err) {
        emailError = err.message || 'Unknown SMTP error';
        console.warn(`⚠️ [Nodemailer Failed] Could not deliver registration email: ${emailError}`);
      }
    }

    return res.json({
      success: true,
      maskedEmail: maskEmail(targetEmail),
      citizenName,
      emailSent,
      devOtp: !emailSent ? otp : undefined,
      message: emailSent
        ? `Registration OTP sent successfully to ${maskEmail(targetEmail)}.`
        : `Registration OTP generated for ${maskEmail(targetEmail)} (Demo Mode).`,
    });
  } catch (err) {
    console.error('❌ Server error in /api/auth/send-register-otp:', err);
    return res.status(500).json({ error: 'Failed to process registration OTP request. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  POST /api/auth/verify-register-otp
//  Body: { aadharNumber: "...", otp: "...", email: "...", name: "..." }
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/auth/verify-register-otp', (req, res) => {
  try {
    const aadhar = normalizeAadhar(req.body.aadharNumber);
    const { otp, email, name } = req.body;

    if (!aadhar || !otp) {
      return res.status(400).json({ error: 'Aadhar number and OTP are required.' });
    }

    const record = registerOtpStore.get(aadhar);
    if (!record) {
      return res.status(400).json({
        error: 'No active registration OTP found for this Aadhar. Please request a new OTP.',
      });
    }

    if (Date.now() > record.expiresAt) {
      registerOtpStore.delete(aadhar);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Incorrect OTP. Please check the code sent to your email and try again.' });
    }

    // OTP verified — save the citizen permanently
    const finalName = record.name || name?.trim() || 'Citizen';
    const finalEmail = (record.email || email || '').trim().toLowerCase();

    citizenMap[aadhar] = {
      name: finalName,
      email: finalEmail,
    };
    saveRegistry(citizenMap);
    registerOtpStore.delete(aadhar);

    console.log(`🎉 [Citizen Registered via Verified OTP] ${finalName} (${finalEmail}) mapped to Aadhar ${aadhar}`);

    return res.json({
      success: true,
      message: 'Email verified and citizen identity registered successfully.',
      citizenName: finalName,
      citizenEmail: finalEmail,
      aadhar,
    });
  } catch (err) {
    console.error('❌ Error in /api/auth/verify-register-otp:', err);
    return res.status(500).json({ error: 'Registration verification failed. Please try again.' });
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

// ═══════════════════════════════════════════════════════════════════════
//  POST /api/stripe/create-checkout-session
//  Body: { propertyId, propertyTitle, amount, currency, buyerEmail, buyerName, seller }
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const {
      propertyId,
      propertyTitle,
      amount,
      currency = 'inr',
      buyerEmail,
      buyerName,
      seller,
    } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const title = propertyTitle || propertyId || 'Property Conveyance';
    const numAmount = Number(amount);

    console.log(`\n💳 [Stripe Checkout] Creating session for ${propertyId} (${title}) - ₹${numAmount.toLocaleString('en-IN')}`);

    const buildSessionParams = (curr, unitAmount) => {
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append(
        'success_url',
        `${frontendBaseUrl}/?session_id={CHECKOUT_SESSION_ID}&payment_status=success`
      );
      params.append(
        'cancel_url',
        `${frontendBaseUrl}/?property_id=${encodeURIComponent(propertyId || '')}&payment_status=cancelled`
      );

      // Line items: amount in smallest currency unit (paise for INR, cents for USD)
      params.append('line_items[0][price_data][currency]', curr.toLowerCase());
      params.append(
        'line_items[0][price_data][product_data][name]',
        `Stamp Duty & Registration Fee — ${title}`
      );
      params.append(
        'line_items[0][price_data][product_data][description]',
        `NBF-Lite Blockchain Land Registry Conveyance Fee (Property ID: ${propertyId || 'N/A'})`
      );
      params.append('line_items[0][price_data][unit_amount]', String(unitAmount));
      params.append('line_items[0][quantity]', '1');

      if (buyerEmail && buyerEmail.includes('@')) {
        params.append('customer_email', buyerEmail.trim());
      }

      params.append('client_reference_id', propertyId || 'NBF-PROP');
      params.append('metadata[propertyId]', propertyId || '');
      params.append('metadata[propertyTitle]', title);
      params.append('metadata[buyerEmail]', buyerEmail || '');
      params.append('metadata[buyerName]', buyerName || '');
      params.append('metadata[seller]', seller || '');
      params.append('metadata[originalAmount]', String(numAmount));

      return params;
    };

    let session;
    try {
      // First attempt with requested currency (e.g. INR in paise)
      const unitAmountInPaise = Math.round(numAmount * 100);
      const params = buildSessionParams(currency, unitAmountInPaise);
      session = await stripeApiRequest('/checkout/sessions', 'POST', params);
    } catch (firstErr) {
      console.warn(`⚠️ [Stripe Session Initial Attempt]: ${firstErr.message}`);
      // If currency is not supported by the Stripe account (e.g. account not configured for INR), fallback gracefully to USD
      if (
        firstErr.message &&
        (firstErr.message.toLowerCase().includes('currency') ||
          firstErr.message.toLowerCase().includes('inr') ||
          firstErr.message.toLowerCase().includes('country'))
      ) {
        console.log('🔄 Retrying Stripe session with USD currency equivalent...');
        // Approximate 1 USD = 85 INR
        const usdEquivalentCents = Math.max(100, Math.round((numAmount / 85) * 100));
        const paramsUsd = buildSessionParams('usd', usdEquivalentCents);
        session = await stripeApiRequest('/checkout/sessions', 'POST', paramsUsd);
      } else {
        throw firstErr;
      }
    }

    console.log(`✅ [Stripe Checkout Session Created] ID: ${session.id}`);
    console.log(`🔗 [Stripe Checkout URL] ${session.url}`);

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error('❌ Error creating Stripe session:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to create Stripe checkout session.',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  GET /api/stripe/verify-session
//  Query: ?session_id=cs_test_...
// ═══════════════════════════════════════════════════════════════════════
app.get('/api/stripe/verify-session', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id query parameter is required.' });
    }

    console.log(`\n🔍 [Stripe Verify] Checking checkout session: ${session_id}`);
    const session = await stripeApiRequest(`/checkout/sessions/${encodeURIComponent(session_id)}`);

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    const paymentIntentId = session.payment_intent || session.id;
    const challanNo = `STRIPE-${(paymentIntentId.split('_')[1] || paymentIntentId).slice(-10).toUpperCase()}`;
    const paymentHash = `0x${Array.from(paymentIntentId).map((c) => c.charCodeAt(0).toString(16)).join('').slice(0, 48)}`;

    console.log(`✅ [Stripe Session Verified] Status: ${session.payment_status} | Challan: ${challanNo}`);

    return res.json({
      success: true,
      paid: isPaid,
      status: session.status,
      paymentStatus: session.payment_status,
      sessionId: session.id,
      paymentIntent: session.payment_intent,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      currency: (session.currency || 'inr').toUpperCase(),
      customerEmail: session.customer_details?.email || session.customer_email,
      metadata: session.metadata || {},
      challanNo,
      paymentHash,
      receiptTimestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Error verifying Stripe session:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to verify Stripe checkout session.',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  GET /api/stripe/config
// ═══════════════════════════════════════════════════════════════════════
app.get('/api/stripe/config', (_req, res) => {
  res.json({
    configured: isStripeConfigured,
    mode: stripeApiKey.startsWith('sk_test_') ? 'test' : 'live',
    frontendUrl: frontendBaseUrl,
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  GET /api/properties (All properties from registry)
// ═══════════════════════════════════════════════════════════════════════
app.get('/api/properties', (_req, res) => {
  const properties = loadProperties();
  res.json({
    success: true,
    count: properties.length,
    properties,
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  GET /api/properties/for-sale (Only properties listed for sale)
// ═══════════════════════════════════════════════════════════════════════
app.get('/api/properties/for-sale', (_req, res) => {
  const properties = loadProperties();
  const forSale = properties.filter((p) => p.listedForSale === true || p.status === 'for_sale');
  res.json({
    success: true,
    count: forSale.length,
    properties: forSale,
  });
});

// ─── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'PropChain Auth (Nodemailer) & Stripe Payment Gateway',
    smtpConfigured: isSmtpConfigured,
    smtpUser: process.env.SMTP_USER || null,
    stripeConfigured: isStripeConfigured,
    stripeKeyMode: stripeApiKey.startsWith('sk_test_') ? 'test' : 'live',
    totalCitizens: Object.keys(citizenMap).length,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================================`);
    console.log(`🚀 PropChain OTP Authentication Server & Stripe Gateway`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📧 SMTP Email: ${isSmtpConfigured ? 'CONNECTED (' + process.env.SMTP_USER + ')' : 'STANDBY (Demo Mode)'}`);
    console.log(`💳 Stripe Gateway: ${isStripeConfigured ? 'READY (' + (stripeApiKey.startsWith('sk_test_') ? 'Test Mode' : 'Live Mode') + ')' : 'NOT CONFIGURED'}`);
    console.log(`👥 Registered Citizens: ${Object.keys(citizenMap).length}`);
    console.log(`========================================================\n`);
  });
}

export default app;
export { app };
