require('dotenv').config();
const express = require('express'); 
const cors = require('cors');
const tf = require('@tensorflow/tfjs-node');
const { connectToDatabase } = require('./db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const { MongoServerError, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { logHealthCheck } = require('./health-check');

const app = express();

// ======================
// CORS - MUST BE FIRST MIDDLEWARE
// ======================
// Manual CORS middleware to ensure headers are set before any other middleware
app.use((req, res, next) => {
  console.log('CORS Middleware - Origin:', req.headers.origin, 'Method:', req.method, 'Path:', req.path);
  
  const origin = req.headers.origin;
  
  // Set CORS headers for all requests
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-CSRF-Token');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request for:', req.path);
    res.status(200).end();
    return;
  }
  
  console.log('CORS headers set, continuing to next middleware');
  next();
});

// ======================
// Body Parsing Middleware - MUST BE AFTER CORS
// ======================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ======================
// Serve Frontend Static Files (for Railway deployment)
// ======================
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// ======================
// Email Configuration (Using same SMTP as forgot password)
// ======================
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

// Create transporter function (same as forgot password)
const createEmailTransporter = () => {
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  } else {
    console.warn('SMTP not configured; using Nodemailer Ethereal test account for announcements.');
    return null;
  }
};

// Test email configuration on startup
console.log('🔍 Checking SMTP configuration...');
console.log('SMTP_HOST:', SMTP_HOST ? '✅ Set' : '❌ Not set');
console.log('SMTP_PORT:', SMTP_PORT ? '✅ Set' : '❌ Not set');
console.log('SMTP_USER:', SMTP_USER ? '✅ Set' : '❌ Not set');
console.log('SMTP_PASS:', SMTP_PASS ? '✅ Set' : '❌ Not set');
console.log('SMTP_FROM:', SMTP_FROM ? '✅ Set' : '❌ Not set');

const testTransporter = createEmailTransporter();
if (testTransporter) {
  testTransporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP configuration error:', error.message);
      console.log('📧 Please check your SMTP settings in .env file');
    } else {
      console.log('✅ SMTP server is ready to send announcement emails');
    }
  });
} else {
  console.log('⚠️  SMTP not configured - announcements will use test account');
}

// Function to send announcement emails (using same SMTP as forgot password)
const sendAnnouncementEmails = async (announcement, recipients) => {
  try {
    console.log(`📧 Sending announcement emails to ${recipients.length} recipients...`);
    console.log('Recipients:', recipients.map(r => `${r.name} (${r.email})`));
    
    // Use the same SMTP configuration as forgot password
    const transporter = createEmailTransporter();
    let emailSent = false;
    let previewUrl = null;
    
    console.log('Transporter created:', transporter ? '✅ Yes' : '❌ No');
    
    if (transporter) {
      // Use configured SMTP
      const emailPromises = recipients.map(async (recipient) => {
        try {
          const mailOptions = {
            from: SMTP_FROM,
            to: recipient.email,
            subject: `Clinic Announcement: ${announcement.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #294B29; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Clinic Announcement</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                  <h2 style="color: #294B29; margin-top: 0;">${announcement.title}</h2>
                  <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p style="line-height: 1.6; color: #333; white-space: pre-wrap;">${announcement.message}</p>
                  </div>
                  <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
                    <p style="margin: 0; font-size: 14px; color: #666;">
                      <strong>From:</strong> ${announcement.createdBy.name} (${announcement.createdBy.email})<br>
                      <strong>Date:</strong> ${new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div style="background-color: #294B29; color: white; padding: 15px; text-align: center; font-size: 12px;">
                  <p style="margin: 0;">This is an automated message from the Clinic Management System</p>
                </div>
              </div>
            `
          };
          
          const result = await transporter.sendMail(mailOptions);
          console.log(`✅ Email sent to ${recipient.name} (${recipient.email})`);
          return result;
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${recipient.name} (${recipient.email}):`, emailError.message);
          throw emailError;
        }
      });
      
      await Promise.all(emailPromises);
      emailSent = true;
      console.log(`🎉 Successfully sent ${recipients.length} announcement emails via SMTP`);
    } else {
      // Fallback to test account (same as forgot password)
      console.warn('SMTP not configured; using Nodemailer Ethereal test account for announcements.');
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      const emailPromises = recipients.map(async (recipient) => {
        const mailOptions = {
          from: 'ViSORT <no-reply@visort.local>',
          to: recipient.email,
          subject: `Clinic Announcement: ${announcement.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #294B29; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Clinic Announcement</h1>
              </div>
              <div style="padding: 30px; background-color: #f9f9f9;">
                <h2 style="color: #294B29; margin-top: 0;">${announcement.title}</h2>
                <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <p style="line-height: 1.6; color: #333; white-space: pre-wrap;">${announcement.message}</p>
                </div>
                <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>From:</strong> ${announcement.createdBy.name} (${announcement.createdBy.email})<br>
                    <strong>Date:</strong> ${new Date(announcement.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div style="background-color: #294B29; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">This is an automated message from the Clinic Management System</p>
              </div>
            </div>
          `
        };
        
        const result = await testTransporter.sendMail(mailOptions);
        previewUrl = nodemailer.getTestMessageUrl?.(result) || null;
        console.log(`✅ Test email sent to ${recipient.name} (${recipient.email})`);
        if (previewUrl) {
          console.log(`📧 Preview URL: ${previewUrl}`);
        }
        return result;
      });
      
      await Promise.all(emailPromises);
      emailSent = true;
      console.log(`🎉 Successfully sent ${recipients.length} test announcement emails`);
    }
    
    return emailSent;
  } catch (error) {
    console.error('❌ Error sending announcement emails:', error);
    return false;
  }
};

// ======================
// Middleware Setup
// ======================

// Then apply helmet with very permissive settings for CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  // Temporarily disable CSP to avoid conflicts
  contentSecurityPolicy: false,
}));



// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

// More lenient rate limiter for image requests
const imageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Allow more requests for images
  message: 'Too many image requests from this IP, please try again later'
});

// Apply strict rate limiting to all routes except images and OPTIONS requests
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads/')) {
    return imageLimiter(req, res, next);
  }
  if (req.method === 'OPTIONS') {
    return next(); // Skip rate limiting for preflight requests
  }
  return limiter(req, res, next);
});


// ======================
// Database Connection
// ======================
let db;
let isConnecting = false;

const connectWithRetry = async (retryCount = 0) => {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    db = await connectToDatabase();
    console.log('✅ Database connected');
    isConnecting = false;
  } catch (err) {
    console.error('❌ DB connection failed, retrying in 10s...', err.message);
    isConnecting = false;
    
    // Continue retrying indefinitely but with longer intervals
    if (retryCount < 10) {
      setTimeout(() => connectWithRetry(retryCount + 1), 10000); // 10 seconds
    } else {
      console.warn('⚠️ Database connection failed after 10 attempts. Server will continue without database.');
      console.warn('⚠️ Some features may not work until database connection is restored.');
      // Don't exit the process, let the server run without database
      setTimeout(() => connectWithRetry(0), 60000); // Try again in 1 minute
    }
  }
};

// Initial connection
connectWithRetry();

// Periodic health check
setInterval(() => {
  if (!db) connectWithRetry();
}, 10000);

// ======================
// Authentication Endpoints
// ======================

// POST /api/auth/login - User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { employeeId, password } = req.body;

    // Validate input
    if (!employeeId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and password are required' 
      });
    }

    console.log('Login attempt for employee ID:', employeeId);

    // First, check if ANY account exists with this employee number (active or inactive)
    const anyAccount = await db.collection('AccountManagement').findOne({ 
      employeeNumber: employeeId.toString().trim()
    });

    // If no account exists at all with this employee number
    if (!anyAccount) {
      console.log('Employee number not found in system:', employeeId);
      return res.status(401).json({ 
        success: false, 
        message: 'There is no valid employee number in our records. Please contact the administrator.' 
      });
    }

    // Now check for active account specifically
    const account = await db.collection('AccountManagement').findOne({ 
      employeeNumber: employeeId.toString().trim(),
      isActive: true 
    });

    if (!account) {
      console.log('Account found but inactive for employee ID:', employeeId);
      return res.status(401).json({ 
        success: false, 
        message: 'Your account is deactivated. Please contact the administrator.' 
      });
    }

    console.log('Active account found:', {
      employeeNumber: account.employeeNumber,
      firstName: account.firstName,
      lastName: account.lastName,
      role: account.role,
      storedPassword: account.password,
      passwordType: account.password.startsWith('$2') ? 'hashed' : 'plain text'
    });

    // FIXED: Better password checking that works with both hashed and plain text
    let isPasswordValid = false;
    
    if (account.password.startsWith('$2')) {
      // Password is hashed - use bcrypt
      isPasswordValid = await bcrypt.compare(password, account.password);
      console.log('Using bcrypt comparison - result:', isPasswordValid);
    } else {
      // Password is plain text - direct comparison
      isPasswordValid = (password === account.password);
      console.log('Using plain text comparison - result:', isPasswordValid);
      console.log('Input password:', password);
      console.log('Stored password:', account.password);
    }

    if (!isPasswordValid) {
      console.log('Invalid password for employee ID:', employeeId);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password. Please try again.' 
      });
    }

    // Create simple token
    const token = Buffer.from(JSON.stringify({
      userId: account._id.toString(),
      employeeId: account.employeeNumber,
      role: account.role,
      timestamp: Date.now()
    })).toString('base64');

    // Return user data (excluding password)
    const userData = {
      id: account._id.toString(),
      employeeId: account.employeeNumber,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
      isActive: account.isActive
    };

    console.log('Login successful for:', account.employeeNumber);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/user/:employeeId - Get user data by employee ID
app.get('/api/auth/user/:employeeId', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }
    
    const { employeeId } = req.params;
    
    const account = await db.collection('AccountManagement').findOne({ 
      employeeNumber: employeeId 
    });
    
    if (!account) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user data (excluding password)
    const userData = {
      id: account._id.toString(),
      employeeId: account.employeeNumber,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
      isActive: account.isActive
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// GET /api/auth/debug-accounts - Check all accounts
app.get('/api/auth/debug-accounts', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }
    
    const accounts = await db.collection('AccountManagement').find({}).toArray();
    const debugAccounts = accounts.map(account => ({
      employeeNumber: account.employeeNumber,
      firstName: account.firstName,
      lastName: account.lastName,
      storedPassword: account.password,
      passwordType: account.password.startsWith('$2') ? 'hashed' : 'plain text',
      passwordLength: account.password.length,
      isActive: account.isActive
    }));
    
    res.json(debugAccounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optional: Verify Token Endpoint
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: "Token required" });
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired (24 hours)
      const isExpired = Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000;
      
      if (isExpired) {
        return res.status(401).json({ success: false, error: "Token expired" });
      }

      res.json({ success: true, user: decoded });

    } catch (decodeError) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

// ======================
// Upload Directory Setup
// ======================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ======================
// Model + Labels Loading
// ======================
let labels = ['Hazardous', 'Non-Hazardous'];
let model;
let modelLoaded = false;

console.log("🔧 Starting server initialization...");

// Define the model loading function
const loadModel = async () => {
  try {
    console.log("🚀 MODEL LOADER: Starting...");
    
   const modelDir = path.join(__dirname, 'backend', 'model');
    console.log("📁 MODEL LOADER: Checking directory:", modelDir);
    
    if (!fs.existsSync(modelDir)) {
      console.error("❌ MODEL LOADER: Directory not found!");
      return;
    }
    
    const modelFiles = fs.readdirSync(modelDir);
    console.log("MODEL LOADER: Files found:", modelFiles);
    
    const modelJsonPath = path.join(modelDir, 'model.json');
    console.log("MODEL LOADER: model.json exists:", fs.existsSync(modelJsonPath));
    
    if (fs.existsSync(modelJsonPath)) {
      console.log("MODEL LOADER: model.json found, loading model...");
      const modelPath = 'file://' + modelJsonPath.replace(/\\/g, '/');
      console.log("🔗 MODEL LOADER: Loading from:", modelPath);
      
      model = await tf.loadLayersModel(modelPath);
      console.log("MODEL LOADER: TensorFlow.js model loaded successfully!");
      modelLoaded = true;
      
      // Test the model
      const testInput = tf.ones([1, 224, 224, 3]);
      const testOutput = model.predict(testInput);
      console.log("MODEL LOADER: Model test passed, output shape:", testOutput.shape);
      testInput.dispose();
      testOutput.dispose();
      
    } else {
      console.error("MODEL LOADER: model.json not found!");
    }
    
  } catch (err) {
    console.error("MODEL LOADER: Failed to load model:", err.message);
    console.error("MODEL LOADER: Error details:", err.stack);
    modelLoaded = false;
  }
};

// Immediately execute model loading after definition
console.log("🔧 MODEL LOADER: Function defined, now executing...");
loadModel().then(() => {
  console.log("🔧 MODEL LOADER: Initial load completed");
}).catch(err => {
  console.error("🔧 MODEL LOADER: Initial load failed:", err);
});

// Also add a startup delay load in case the first one fails
setTimeout(() => {
  if (!modelLoaded) {
    console.log("MODEL LOADER: Retrying model load after delay...");
    loadModel();
  }
}, 3000);

// Periodic status check
setInterval(() => {
  console.log(`MODEL STATUS: ${modelLoaded ? 'LOADED' : 'NOT LOADED'}`);
}, 15000);

// ======================
// API Endpoints
// ======================

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    database: db ? 'connected' : 'disconnected',
    model: modelLoaded ? 'loaded' : 'not loaded'
  });
});

// ======================
// Improved Prediction Helper
// ======================
async function classifyImage(filePath) {
  if (!model || !modelLoaded) {
    throw new Error("Model not loaded");
  }

  try {
    console.log("Classifying image:", path.basename(filePath));
    
    // Load and validate image
    const image = await loadImage(filePath);
    console.log("Image dimensions:", image.width, "x", image.height);

    // Create canvas and resize image
    const canvas = createCanvas(224, 224);
    const ctx = canvas.getContext('2d');
    
    // Clear canvas and draw image
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 224, 224);
    ctx.drawImage(image, 0, 0, 224, 224);

    // Convert to tensor - ensure proper preprocessing
    let imageTensor;
    try {
      imageTensor = tf.browser.fromPixels(canvas)
        .expandDims(0)
        .toFloat()
        .div(255.0);
      
      console.log("Tensor shape:", imageTensor.shape);
      
      // Run prediction
      const prediction = model.predict(imageTensor);
      const scores = await prediction.data();
      
      // Clean up memory
      prediction.dispose();
      imageTensor.dispose();
      
      // Process results
      const maxScore = Math.max(...scores);
      const predictedIndex = scores.indexOf(maxScore);
      const predictedLabel = labels[predictedIndex] || `Class_${predictedIndex}`;
      
      console.log(`Prediction: ${predictedLabel}, Confidence: ${maxScore.toFixed(4)}`);
      
      return predictedLabel;
      
    } catch (tensorError) {
      console.error("Tensor processing error:", tensorError);
      if (imageTensor) imageTensor.dispose();
      throw tensorError;
    }
    
  } catch (error) {
    console.error("Classification failed:", error.message);
    throw error;
  }
}

// POST /api/auth/forgot-password/send-code - Send verification code to registered email
app.post('/api/auth/forgot-password/send-code', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    const { employeeId } = req.body || {};
    if (!employeeId || typeof employeeId !== 'string' || !employeeId.trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const employeeNumber = employeeId.toString().trim();

    // Find user by employee number
    const account = await db.collection('AccountManagement').findOne({ employeeNumber });
    if (!account) {
      return res.status(404).json({ success: false, message: 'No account found for provided Employee ID' });
    }

    if (!account.email) {
      return res.status(400).json({ success: false, message: 'No email registered for this account' });
    }

    // Generate a 6-digit verification code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    // Upsert code record
    await db.collection('PasswordResetCodes').updateOne(
      { employeeNumber },
      {
        $set: {
          employeeNumber,
          email: account.email,
          code,
          createdAt: now,
          expiresAt,
          attempts: 0
        }
      },
      { upsert: true }
    );

    // Attempt to send email if SMTP is configured
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    let emailSent = false;
    let previewUrl = null;
    const displayName = [account.firstName, account.lastName].filter(Boolean).join(' ') || 'User';
    const subject = 'Your ViSORT password reset code';
    const textBody = `Hi ${displayName},\n\nYour verification code is ${code}. It expires in 15 minutes.\n\nIf you did not request this, you can ignore this email.`;
    // Try to attach logo inline (CID)
    let attachments = [];
    try {
      const logoPath = path.join(__dirname, '..', 'frontend', 'public', 'viSORT_logo.png');
      if (fs.existsSync(logoPath)) {
        attachments.push({ filename: 'viSORT_logo.png', path: logoPath, cid: 'visort_logo' });
      }
    } catch (e) {
      console.warn('Logo attach skipped:', e?.message);
    }
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background:#f6f7f9; padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <tr>
            <td style="background:#294B29; padding:20px; text-align:center;">
              ${attachments.length ? '<img src="cid:visort_logo" alt="ViSORT" style="height:48px; display:block; margin:0 auto 6px auto;" />' : ''}
              <div style="color:#ffffff; font-size:18px; font-weight:600; letter-spacing:.5px;">ViSORT</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 8px; color:#111827; font-size:16px;">Hi ${displayName},</td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0; color:#374151; font-size:14px; line-height:1.6;">
              Use the verification code below to reset your password. This code expires in <strong>15 minutes</strong>.
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px; text-align:center;">
              <div style="display:inline-block; font-size:28px; letter-spacing:4px; font-weight:700; color:#294B29; background:#edf7ee; border:1px solid #d6e7d7; padding:12px 20px; border-radius:10px;">${code}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 16px; color:#6b7280; font-size:12px; text-align:center;">If you did not request this, you can safely ignore this email.</td>
          </tr>
          <tr>
            <td style="background:#f3f4f6; padding:14px 24px; text-align:center; color:#6b7280; font-size:12px;">© ${new Date().getFullYear()} ViSORT</td>
          </tr>
        </table>
      </div>`;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS }
        });

        const info = await transporter.sendMail({
          from: SMTP_FROM,
          to: account.email,
          subject,
          text: textBody,
          html: htmlBody,
          attachments
        });
        previewUrl = nodemailer.getTestMessageUrl?.(info) || null;
        emailSent = true;
      } catch (mailErr) {
        console.error('Email send failed:', mailErr);
      }
    } else {
      console.warn('SMTP not configured; using Nodemailer Ethereal test account.');
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        const info = await transporter.sendMail({
          from: 'ViSORT <no-reply@visort.local>',
          to: account.email,
          subject,
          text: textBody,
          html: htmlBody,
          attachments
        });
        previewUrl = nodemailer.getTestMessageUrl(info);
        emailSent = true;
        console.log('Ethereal preview URL:', previewUrl);
      } catch (ethErr) {
        console.error('Ethereal send failed; falling back to console log only:', ethErr);
      }
    }

    // Always log for development visibility
    console.log(`Password reset code for ${employeeNumber} (${account.email}): ${code}`);

    return res.json({ success: true, message: emailSent ? 'Verification code sent' : 'Verification code generated (email not configured)', previewUrl });
  } catch (error) {
    console.error('Forgot-password send-code error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password/reset - Verify code and set new password
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    const { employeeId, code, newPassword } = req.body || {};
    if (!employeeId || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'employeeId, code and newPassword are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    const employeeNumber = employeeId.toString().trim();
    const record = await db.collection('PasswordResetCodes').findOne({ employeeNumber });
    if (!record) {
      return res.status(400).json({ success: false, message: 'No reset request found. Please request a new code.' });
    }

    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new code.' });
    }

    if (String(record.code) !== String(code).trim()) {
      await db.collection('PasswordResetCodes').updateOne(
        { employeeNumber },
        { $inc: { attempts: 1 } }
      );
      return res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });
    }

    // Hash the new password if existing account uses hash, otherwise store plaintext (to match current login strategy)
    const account = await db.collection('AccountManagement').findOne({ employeeNumber });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let finalPassword = newPassword.trim();
    if (account.password && account.password.startsWith('$2')) {
      // Existing stored password is bcrypt hash → hash the new password too
      const saltRounds = 10;
      finalPassword = await bcrypt.hash(finalPassword, saltRounds);
    }

    await db.collection('AccountManagement').updateOne(
      { employeeNumber },
      { $set: { password: finalPassword } }
    );

    // Consume the code
    await db.collection('PasswordResetCodes').deleteOne({ employeeNumber });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Forgot-password reset error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ======================
// Improved Upload Endpoint with Fallback
// ======================
app.post('/api/upload', express.raw({ type: 'image/jpeg', limit: '5mb' }), async (req, res) => {
  try {
    // Database check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not connected" 
      });
    }

    // Save image first
    const filename = `esp32_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.body);
    
    console.log("📸 Image saved:", filename, "Size:", req.body.length, "bytes");

    let predictedLabel = "Unknown";
    let classificationMethod = "none";

    // Try AI classification if model is loaded
    if (modelLoaded && model) {
      try {
        predictedLabel = await classifyImage(filePath);
        classificationMethod = "ai_model";
        console.log("AI Classification result:", predictedLabel);
      } catch (classificationError) {
        console.error("❌ AI classification failed, using fallback:", classificationError.message);
        classificationMethod = "fallback";
        // Fall through to fallback classification
      }
    } else {
      console.warn("⚠️ Model not loaded, using fallback classification");
      classificationMethod = "fallback";
    }

    // Fallback classification based on file size or other heuristics
    if (classificationMethod === "fallback" || predictedLabel === "Unknown") {
      const stats = fs.statSync(filePath);
      // Simple heuristic: larger images might be non-hazardous (better quality)
      predictedLabel = stats.size > 4000 ? "Non-Hazardous" : "Hazardous";
      console.log("🔄 Fallback classification:", predictedLabel, "based on file size:", stats.size);
    }

    // Save to database
    const currentDate = new Date();
    const newRecord = {
      binId: "ESP32CAM-01",
      binType: predictedLabel,
      imageUrl: `/uploads/${filename}`,
      classificationMethod: classificationMethod,
      fileSize: req.body.length,
      createdAt: currentDate, // Use createdAt as the disposal date
      garbageType: "Unknown", // Default garbage type
      handledBy: "ESP32 Camera", // Default handler
      destination: "Waste Processing Facility" // Default destination
    };

    await db.collection('disposalHistory').insertOne(newRecord);

    res.status(201).json({ 
      success: true, 
      message: `Image uploaded and classified (${classificationMethod})`, 
      data: newRecord 
    });
    
  } catch (err) {
    console.error("📸 Upload error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Upload failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ======================
// Model Status Endpoint (for debugging)
// ======================
app.get('/api/model-status', (req, res) => {
  res.json({
    modelLoaded: modelLoaded,
    labels: labels,
    hasModel: !!model,
    modelInputShape: model?.inputs[0]?.shape,
    modelOutputShape: model?.outputs[0]?.shape
  });
});

// ======================
// Announcements API Endpoints
// ======================

console.log('🔔 Announcement routes loaded successfully');
console.log('📋 Available routes:');
console.log('  - GET /api/announcements/user');
console.log('  - PATCH /api/announcements/user/:id/read');
console.log('  - PATCH /api/announcements/user/mark-all-read');
console.log('  - POST /api/announcements (admin)');
console.log('  - GET /api/announcements (admin)');
console.log('✅ Announcement router exported successfully');

// GET /api/announcements/debug - Debug endpoint to check raw data
app.get('/api/announcements/debug', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not connected" 
      });
    }

    const announcements = await db.collection('Announcements').find({}).toArray();
    
    res.json({
      success: true,
      rawData: announcements,
      count: announcements.length
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch debug data" 
    });
  }
});

// GET /api/announcements - Get all announcements
app.get('/api/announcements', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not connected" 
      });
    }

    const { status, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };

    const [announcements, total] = await Promise.all([
      db.collection('Announcements').find(query, options).toArray(),
      db.collection('Announcements').countDocuments(query)
    ]);

    // Transform data
    const transformedData = announcements.map(announcement => ({
      id: announcement._id.toString(),
      title: announcement.title,
      message: announcement.message,
      status: announcement.status,
      date: announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : 'Unknown',
      read: announcement.read || false,
      createdAt: announcement.createdAt ? new Date(announcement.createdAt).toISOString() : null,
      createdBy: announcement.createdBy || { name: 'Unknown Admin', email: 'unknown@example.com' },
      recipients: announcement.recipients || []
    }));

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Announcements GET error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch announcements" 
    });
  }
});

// POST /api/announcements - Create new announcement
app.post('/api/announcements', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not connected" 
      });
    }

    const { title, message, status = 'draft', createdBy, recipients = [] } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: "Title and message are required"
      });
    }

    if (!createdBy || !createdBy.name || !createdBy.email) {
      return res.status(400).json({
        success: false,
        error: "Admin information (createdBy) is required"
      });
    }

    if (!['draft', 'sent'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be 'draft' or 'sent'"
      });
    }

    const newAnnouncement = {
      title: title.trim(),
      message: message.trim(),
      status,
      read: false,
      createdBy: {
        name: createdBy.name.trim(),
        email: createdBy.email.trim()
      },
      recipients: recipients.map(recipient => ({
        id: recipient.id,
        name: recipient.name.trim(),
        email: recipient.email.trim()
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('Announcements').insertOne(newAnnouncement);

    // Send emails if status is 'sent' and there are recipients
    if (status === 'sent' && recipients.length > 0) {
      try {
        await sendAnnouncementEmails(newAnnouncement, recipients);
        console.log(`Emails sent to ${recipients.length} recipients for announcement: ${title}`);
      } catch (emailError) {
        console.error('Email sending failed, but announcement was saved:', emailError);
        // Don't fail the request if email sending fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: {
        id: result.insertedId.toString(),
        ...newAnnouncement,
        createdAt: newAnnouncement.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Announcements POST error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create announcement" 
    });
  }
});

// PUT /api/announcements/:id - Update announcement
app.put('/api/announcements/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not connected" 
      });
    }

    const { id } = req.params;
    const { title, message, status, read } = req.body;

    // Validation
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid announcement ID"
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (message !== undefined) updateData.message = message.trim();
    if (status !== undefined) {
      if (!['draft', 'sent'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Status must be 'draft' or 'sent'"
        });
      }
      updateData.status = status;
    }
    if (read !== undefined) updateData.read = Boolean(read);

    const result = await db.collection('Announcements').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Announcement not found"
      });
    }

    res.json({
      success: true,
      message: "Announcement updated successfully"
    });

  } catch (error) {
    console.error('Announcements PUT error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update announcement" 
    });
  }
});

// DELETE /api/announcements/:id - Delete announcement
app.delete('/api/announcements/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not connected" 
      });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid announcement ID"
      });
    }

    const result = await db.collection('Announcements').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Announcement not found"
      });
    }

    res.json({
      success: true,
      message: "Announcement deleted successfully"
    });

  } catch (error) {
    console.error('Announcements DELETE error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete announcement" 
    });
  }
});

// ======================
// Serve Uploaded Images with CORS
// ======================
// Serve uploaded images through dedicated endpoint with proper CORS
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Set appropriate content type
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Send the file
  res.sendFile(filePath);
});

// Also keep static serving as fallback
app.use('/uploads', express.static(uploadDir));

// Optional: List uploaded images
app.get('/uploads/list', async (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const fileInfo = files.map(file => {
      const stats = fs.statSync(path.join(uploadDir, file));
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime
      };
    });
    res.json({ files: fileInfo });
  } catch (err) {
    res.status(500).json({ error: "Cannot read uploads folder" });
  }
});

// GET /api/accounts - Fetch all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, error: "Database connection error" });
    }
    const accounts = await db.collection('AccountManagement').find({}).toArray();

    // Remove sensitive info like passwords before sending back
    const sanitizedAccounts = accounts.map(({ password, ...rest }) => rest);

    res.status(200).json(sanitizedAccounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/accounts - Create New Account
app.post('/api/accounts', async (req, res) => {
  try {
    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    // Destructure with default values
    const {
      employeeNumber = '',
      firstName = '',
      lastName = '',
      email = '',
      password = '',
      confirmPassword = '',
      role = 'employee'
    } = req.body;

    // Trim all string inputs
    const trimmedInputs = {
      employeeNumber: employeeNumber.toString().trim(),
      firstName: firstName.toString().trim(),
      lastName: lastName.toString().trim(),
      email: email.toString().toLowerCase().trim(),
      password: password.toString().trim(),
      confirmPassword: confirmPassword.toString().trim(),
      role: role.toString().toLowerCase().trim()
    };

    // Validate required fields
    const requiredFields = ['employeeNumber', 'firstName', 'lastName', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !trimmedInputs[field]);

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Password validation
    if (trimmedInputs.password !== trimmedInputs.confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "Password and confirmation do not match" 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedInputs.email)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid email format" 
      });
    }

    // Stronger password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(trimmedInputs.password)) {
      return res.status(400).json({
        success: false,
        error: "Password must contain: 8+ characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character"
      });
    }

    // Role validation
    const validRoles = ['employee', 'admin', 'manager'];
    if (!validRoles.includes(trimmedInputs.role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(trimmedInputs.password, 12);

    // Create account object
    const newAccount = {
      employeeNumber: trimmedInputs.employeeNumber,
      firstName: trimmedInputs.firstName,
      lastName: trimmedInputs.lastName,
      email: trimmedInputs.email,
      password: hashedPassword,
      role: trimmedInputs.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // Insert into database
    const result = await db.collection('AccountManagement').insertOne(newAccount);

    // Successful response (exclude sensitive data)
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      account: {
        id: result.insertedId,
        employeeNumber: newAccount.employeeNumber,
        firstName: newAccount.firstName,
        lastName: newAccount.lastName,
        email: newAccount.email,
        role: newAccount.role,
        createdAt: newAccount.createdAt,
        isActive: newAccount.isActive
      }
    });

  } catch (error) {
    // Handle duplicate key errors
    if (error instanceof MongoServerError && error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field === 'email' ? 'Email' : 'Employee number'} already exists`
      });
    }

    // Log and handle other errors
    console.error('Account creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/accounts/:id - Update Account
app.put('/api/accounts/:id', async (req, res) => {
  try {
    console.log('PUT /api/accounts/:id - Update request received');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);

    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { id } = req.params;
    const {
      employeeNumber = '',
      firstName = '',
      lastName = '',
      email = '',
      password = '',
      role = 'employee',
      isActive = null
    } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid account ID format"
      });
    }

    // Trim all string inputs
    const trimmedInputs = {
      employeeNumber: employeeNumber.toString().trim(),
      firstName: firstName.toString().trim(),
      lastName: lastName.toString().trim(),
      email: email.toString().toLowerCase().trim(),
      password: password.toString().trim(),
      role: role.toString().toLowerCase().trim()
    };

    // Check if this is a soft delete/restore operation (only isActive is being updated)
    const isSoftDeleteOperation = isActive !== null && 
      !employeeNumber && !firstName && !lastName && !email && !password;

    // Validate required fields (except password which is optional) - skip if soft delete
    if (!isSoftDeleteOperation) {
      const requiredFields = ['employeeNumber', 'firstName', 'lastName', 'email'];
      const missingFields = requiredFields.filter(field => !trimmedInputs[field]);

      if (missingFields.length) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        });
      }
    }

    // Email validation - skip if soft delete
    if (!isSoftDeleteOperation) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedInputs.email)) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid email format" 
        });
      }

      // Role validation
      const validRoles = ['employee', 'admin', 'manager'];
      if (!validRoles.includes(trimmedInputs.role)) {
        return res.status(400).json({
          success: false,
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }
    }

    // Check if account exists
    const existingAccount = await db.collection('AccountManagement').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        error: "Account not found"
      });
    }

    // Check if employee number is being changed and if it conflicts with another account - skip if soft delete
    if (!isSoftDeleteOperation && trimmedInputs.employeeNumber !== existingAccount.employeeNumber) {
      const duplicateAccount = await db.collection('AccountManagement').findOne({
        employeeNumber: trimmedInputs.employeeNumber,
        _id: { $ne: new ObjectId(id) }
      });

      if (duplicateAccount) {
        return res.status(400).json({
          success: false,
          error: "Employee number already exists"
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    // For soft delete operations, only update isActive
    if (isSoftDeleteOperation) {
      updateData.isActive = isActive;
    } else {
      // For regular updates, include all fields
      updateData.employeeNumber = trimmedInputs.employeeNumber;
      updateData.firstName = trimmedInputs.firstName;
      updateData.lastName = trimmedInputs.lastName;
      updateData.email = trimmedInputs.email;
      updateData.role = trimmedInputs.role;
    }

    // Only update password if provided and not soft delete
    if (trimmedInputs.password && !isSoftDeleteOperation) {
      // Password validation for updates
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(trimmedInputs.password)) {
        return res.status(400).json({
          success: false,
          error: "Password must contain: 8+ characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character"
        });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(trimmedInputs.password, 12);
      updateData.password = hashedPassword;
    }

    // Update the account
    console.log('Updating account with data:', updateData);
    const result = await db.collection('AccountManagement').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      console.log('No account found with ID:', id);
      return res.status(404).json({
        success: false,
        error: "Account not found"
      });
    }

    // Fetch updated account (excluding password)
    const updatedAccount = await db.collection('AccountManagement').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    console.log('Account updated successfully:', updatedAccount.employeeNumber);

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      account: updatedAccount
    });

  } catch (error) {
    console.error('Account update error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/accounts/:id - Delete Account
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid account ID format"
      });
    }

    // Check if account exists
    const existingAccount = await db.collection('AccountManagement').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        error: "Account not found"
      });
    }

    // Delete the account
    const result = await db.collection('AccountManagement').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Account not found"
      });
    }

    console.log('Account deleted successfully:', existingAccount.employeeNumber);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Compliance Reports API Endpoints

// GET /api/compliance-reports - Fetch all compliance reports
app.get('/api/compliance-reports', async (req, res) => {
  try {
    console.log('GET /api/compliance-reports - Fetching compliance reports');
    
    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { status, page = 1, limit = 50 } = req.query;
    
    // Build query filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch reports with pagination
    const reports = await db.collection('ComplianceReports')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count for pagination
    const totalCount = await db.collection('ComplianceReports').countDocuments(filter);

    console.log(`Found ${reports.length} compliance reports`);

    res.status(200).json({
      success: true,
      reports: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount: totalCount,
        hasNext: skip + reports.length < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Compliance reports fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/compliance-reports - Create new compliance report
app.post('/api/compliance-reports', async (req, res) => {
  try {
    console.log('POST /api/compliance-reports - Creating new compliance report');
    console.log('Request body:', req.body);

    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const {
      title = '',
      message = '',
      status = 'Draft'
    } = req.body;

    // Validate required fields
    if (!title.trim() || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Title and message are required"
      });
    }

    // Validate status
    const validStatuses = ['Draft', 'Sent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Create new report
    const newReport = {
      title: title.trim(),
      message: message.trim(),
      status: status,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      time: new Date().toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit' 
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into database
    const result = await db.collection('ComplianceReports').insertOne(newReport);
    
    if (result.insertedId) {
      const createdReport = await db.collection('ComplianceReports').findOne({ _id: result.insertedId });
      console.log('Compliance report created successfully:', createdReport.title);

      res.status(201).json({
        success: true,
        message: "Compliance report created successfully",
        report: createdReport
      });
    } else {
      throw new Error('Failed to create compliance report');
    }

  } catch (error) {
    console.error('Compliance report creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/compliance-reports/:id - Update compliance report
app.put('/api/compliance-reports/:id', async (req, res) => {
  try {
    console.log('PUT /api/compliance-reports/:id - Updating compliance report');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);

    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { id } = req.params;
    const {
      title = '',
      message = '',
      status = ''
    } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid report ID format"
      });
    }

    // Check if report exists
    const existingReport = await db.collection('ComplianceReports').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        error: "Compliance report not found"
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (title.trim()) {
      updateData.title = title.trim();
    }
    if (message.trim()) {
      updateData.message = message.trim();
    }
    if (status && ['Draft', 'Sent'].includes(status)) {
      updateData.status = status;
      // Update date and time when status changes to Sent
      if (status === 'Sent' && existingReport.status !== 'Sent') {
        updateData.date = new Date().toISOString().split('T')[0];
        updateData.time = new Date().toLocaleTimeString('en-US', { 
          hour12: true, 
          hour: 'numeric', 
          minute: '2-digit' 
        });
      }
    }

    // Update the report
    const result = await db.collection('ComplianceReports').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Compliance report not found"
      });
    }

    // Fetch updated report
    const updatedReport = await db.collection('ComplianceReports').findOne({ _id: new ObjectId(id) });
    console.log('Compliance report updated successfully:', updatedReport.title);

    res.status(200).json({
      success: true,
      message: "Compliance report updated successfully",
      report: updatedReport
    });

  } catch (error) {
    console.error('Compliance report update error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/compliance-reports/:id - Delete compliance report
app.delete('/api/compliance-reports/:id', async (req, res) => {
  try {
    console.log('DELETE /api/compliance-reports/:id - Deleting compliance report');
    console.log('Request params:', req.params);

    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid report ID format"
      });
    }

    // Check if report exists
    const existingReport = await db.collection('ComplianceReports').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        error: "Compliance report not found"
      });
    }

    // Delete the report
    const result = await db.collection('ComplianceReports').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Compliance report not found"
      });
    }

    console.log('Compliance report deleted successfully:', existingReport.title);

    res.status(200).json({
      success: true,
      message: "Compliance report deleted successfully"
    });

  } catch (error) {
    console.error('Compliance report deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Disposal History Endpoint
app.get('/api/disposals', async (req, res) => {
  try {
    // 1. Database connection check (like in your working endpoints)
    if (!db) {
      console.error('Database connection not established');
      return res.status(500).json({ error: "Database not connected" });
    }

    // 2. Log the first few documents to verify structure
    const sampleDocs = await db.collection('disposalHistory').find().limit(2).toArray();
    console.log('Sample documents:', JSON.stringify(sampleDocs, null, 2));

    // 3. Build query with safe defaults (like your other endpoints)
    const { 
      type, 
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 20,
      binId,
      types,
      requireDate,
      requireFileSize
    } = req.query;

    const query = {};
    const options = {
      sort: { disposalDate: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };
    // 3b. Field projection (summary)
    if (req.query.fields && String(req.query.fields).toLowerCase() === 'summary') {
      options.projection = {
        _id: 1,
        binId: 1,
        binType: 1,
        imageUrl: 1,
        classificationMethod: 1,
        fileSize: 1,
        createdAt: 1,
        disposalDate: 1 // keep disposalDate in case consumers prefer it
      };
    }

    // 4. Type filter (single or multiple via query params)
    if (type && ['Hazardous', 'Non-Hazardous'].includes(type)) {
      query.binType = type;
    } else if (types) {
      const list = String(types)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (list.length) {
        query.binType = { $in: list };
      }
    }

    // 4b. Bin ID filter
    if (binId) {
      query.binId = String(binId);
    }

    // 5. Safe date filtering (only apply if field exists)
    if (startDate || endDate) {
      query.$and = query.$and || [];
      // Use createdAt for date filtering to match waste stats summary endpoint
      query.$and.push({ createdAt: { $exists: true } });
      if (startDate) query.$and.push({ createdAt: { $gte: new Date(startDate) } });
      if (endDate) query.$and.push({ createdAt: { $lte: new Date(endDate) } });
    }

    // 5b. Require a real Date in any of the known date fields
    if (String(requireDate).toLowerCase() === 'true') {
      const dateTypeMatch = [
        { disposalDate: { $type: 'date' } },
        { createdAt: { $type: 'date' } },
        { lastUpdated: { $type: 'date' } },
        { date: { $type: 'date' } }
      ];
      query.$and = query.$and || [];
      query.$and.push({ $or: dateTypeMatch });
    }

    // 5c. Require fileSize field to exist and be numeric (>= 0)
    if (String(requireFileSize).toLowerCase() === 'true') {
      query.$and = query.$and || [];
      query.$and.push({ fileSize: { $exists: true } });
      query.$and.push({ $expr: { $gte: [ { $toDouble: "$fileSize" }, 0 ] } });
    }

    // 6. Text search (optional like in your other endpoints)
    if (search) {
      const indexes = await db.collection('disposalHistory').indexes();
      if (indexes.some(idx => idx.textIndexVersion)) {
        query.$text = { $search: search };
      } else {
        console.warn('Text search attempted but no text index exists');
      }
    }

    // 7. Execute queries (with same pattern as working endpoints)
    const [disposals, total] = await Promise.all([
      db.collection('disposalHistory').find(query, options).toArray(),
      db.collection('disposalHistory').countDocuments(query)
    ]);

    // 8. Transform results to match Flutter app expected structure
    console.log('🔍 DEBUG: Raw disposals from DB:', disposals.length, 'records');
    console.log('🔍 DEBUG: Query used:', JSON.stringify(query, null, 2));
    
    const transformedData = disposals.map(doc => {
      // Required fields (with validation like your other endpoints)
      if (!doc.binId || !doc.binType) {
        console.warn('Document missing required fields:', doc._id);
        return null; // Or filter out invalid docs
      }

      // Build response object with only fields used by DisposalHistory.js
      const transformed = {
        _id: doc._id.toString(),
        binId: doc.binId,
        binType: doc.binType,
        garbageType: doc.garbageType || 'Unknown Waste',
        imageUrl: doc.imageUrl || null,
        image: doc.imageUrl || null, // Alternative field name for compatibility
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
        lastUpdated: doc.lastUpdated ? new Date(doc.lastUpdated).toISOString() : null,
        date: doc.disposalDate ? new Date(doc.disposalDate).toISOString() : null
      };
      
      console.log('🔍 DEBUG: Transformed record:', JSON.stringify(transformed, null, 2));
      return transformed;
    }).filter(Boolean); // Remove any null entries from invalid docs
    
    console.log('🔍 DEBUG: Final transformed data count:', transformedData.length);

    // 9. Return response in Flutter app expected format
    const response = {
      success: true,
      data: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    console.log('🔍 DEBUG: Final API response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    // 10. Enhanced error handling matching your other endpoints
    console.error('Disposal endpoint error:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    
    res.status(500).json({ 
      success: false, // Consistent with your other endpoints
      error: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
});

// ======================
// Flutter Disposal History API Endpoint
// ======================

// GET /api/flutter/disposals - Get disposal history for Flutter app
app.get('/api/flutter/disposals', async (req, res) => {
  try {
    // Database connection check
    if (!db) {
      console.error('Database connection not established');
      return res.status(500).json({ error: "Database not connected" });
    }

    // Build query with same parameters as React endpoint
    const { 
      type, 
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 100,
      binId,
      types,
      requireDate,
      requireFileSize
    } = req.query;

    const query = {};
    const options = {
      sort: { disposalDate: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };

    // Type filter (single or multiple via query params) - same as React
    if (type && ['Hazardous', 'Non-Hazardous'].includes(type)) {
      query.binType = type;
    } else if (types) {
      const list = String(types)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (list.length) {
        query.binType = { $in: list };
      }
    }

    // Bin ID filter - same as React
    if (binId) {
      query.binId = String(binId);
    }

    // Date filtering - same as React
    if (startDate || endDate) {
      query.$and = query.$and || [];
      query.$and.push({ disposalDate: { $exists: true } });
      if (startDate) query.$and.push({ disposalDate: { $gte: new Date(startDate) } });
      if (endDate) query.$and.push({ disposalDate: { $lte: new Date(endDate) } });
    }

    // Require valid date - same as React
    if (String(requireDate).toLowerCase() === 'true') {
      const dateTypeMatch = [
        { disposalDate: { $type: 'date' } },
        { createdAt: { $type: 'date' } },
        { lastUpdated: { $type: 'date' } },
        { date: { $type: 'date' } }
      ];
      query.$and = query.$and || [];
      query.$and.push({ $or: dateTypeMatch });
    }

    // Require file size - same as React
    if (String(requireFileSize).toLowerCase() === 'true') {
      query.$and = query.$and || [];
      query.$and.push({ fileSize: { $exists: true } });
      query.$and.push({ $expr: { $gte: [ { $toDouble: "$fileSize" }, 0 ] } });
    }

    // Text search - same as React
    if (search) {
      const indexes = await db.collection('disposalHistory').indexes();
      if (indexes.some(idx => idx.textIndexVersion)) {
        query.$text = { $search: search };
      } else {
        console.warn('Text search attempted but no text index exists');
      }
    }

    // Execute queries - same as React
    const [disposals, total] = await Promise.all([
      db.collection('disposalHistory').find(query, options).toArray(),
      db.collection('disposalHistory').countDocuments(query)
    ]);

    // Transform results for Flutter with full URLs and enhanced fields
    console.log('🔍 FLUTTER DEBUG: Raw disposals from DB:', disposals.length, 'records');
    console.log('🔍 FLUTTER DEBUG: Query used:', JSON.stringify(query, null, 2));
    
    const transformedData = disposals.map(doc => {
      // Required fields validation
      if (!doc.binId || !doc.binType) {
        console.warn('FLUTTER: Document missing required fields:', doc._id);
        return null;
      }

      // Build response object with Flutter-optimized fields
      const transformed = {
        _id: doc._id.toString(),
        binId: doc.binId,
        binType: doc.binType,
        garbageType: doc.garbageType || 'Unknown Waste',
        imageUrl: doc.imageUrl || null, // Relative path for Flutter (same as React)
        disposalDate: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
        fileSize: doc.fileSize || 0,
        handledBy: doc.handledBy || 'ESP32 Camera',
        classificationMethod: doc.classificationMethod || 'unknown',
        confidence: doc.confidence || 0,
        // Additional Flutter-specific fields
        weight: doc.weight || null,
        volume: doc.volume || null,
        destination: doc.destination || 'Unknown',
        location: doc.location || null,
        notes: doc.notes || '',
        isVerified: doc.isVerified || false,
        verifiedBy: doc.verifiedBy || null,
        verifiedAt: doc.verifiedAt || null
      };
      
      console.log('🔍 FLUTTER DEBUG: Transformed record:', JSON.stringify(transformed, null, 2));
      return transformed;
    }).filter(Boolean); // Remove any null entries from invalid docs
    
    console.log('🔍 FLUTTER DEBUG: Final transformed data count:', transformedData.length);

    // Return response in Flutter-optimized format
    const response = {
      success: true,
      data: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    console.log('🔍 FLUTTER DEBUG: Final API response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    // Enhanced error handling
    console.error('FLUTTER Disposal endpoint error:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    
    res.status(500).json({ 
      success: false,
      error: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
});

// Non-Hazardous Waste Endpoints
app.get('/api/nonhazardous', async (req, res) => {
  try {
    const items = await db.collection('NonHazardous')
      .find({})
      .sort({ lastUpdated: -1 })
      .limit(100)
      .toArray();
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/nonhazardous/:binId', async (req, res) => {
  try {
    const bin = await db.collection('NonHazardous')
      .findOne({ id: parseInt(req.params.binId) });
    if (!bin) return res.status(404).json({ error: "Bin not found" });
    res.json(bin);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Hazardous Waste Endpoints
app.get('/api/hazardous', async (req, res) => {
  try {
    const items = await db.collection('Hazardous')
      .find({})
      .sort({ lastUpdated: -1 })
      .limit(100)
      .toArray();
    res.json(items);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/waste/monthly - last 12 months counts for Hazardous and Non-Hazardous
app.get('/api/waste/monthly', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    // Helper to aggregate a collection by month
    const aggregateByMonth = async (collectionName) => {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      // Try to use a date field commonly present; fall back to lastUpdated if not
      const dateFieldOptions = ['disposalDate', 'createdAt', 'lastUpdated', 'date'];
      let dateField = 'lastUpdated';
      // Best effort check: prefer disposalDate if documents have it
      const sample = await db.collection(collectionName).find({}).limit(1).toArray();
      if (sample && sample[0]) {
        for (const f of dateFieldOptions) {
          if (Object.prototype.hasOwnProperty.call(sample[0], f)) { dateField = f; break; }
        }
      }

      const pipeline = [
        // Only include documents where the chosen field is a real Date
        { $match: { [dateField]: { $type: 'date', $gte: twelveMonthsAgo } } },
        { $project: { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } } },
        { $group: { _id: { year: '$year', month: '$month' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ];
      const results = await db.collection(collectionName).aggregate(pipeline).toArray();
      return results;
    };

    const [haz, nonhaz] = await Promise.all([
      aggregateByMonth('Hazardous'),
      aggregateByMonth('NonHazardous')
    ]);

    // Build last 12 month labels
    const labels = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const toSeries = (agg) => {
      const map = new Map();
      for (const r of agg) {
        const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
        map.set(key, r.count);
      }
      return labels.map(k => map.get(k) || 0);
    };

    res.json({
      success: true,
      labels,
      hazardous: toSeries(haz),
      nonHazardous: toSeries(nonhaz)
    });
  } catch (error) {
    console.error('Monthly aggregation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Monthly stats endpoint for Flutter app
app.get('/api/waste/stats/monthly', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const months = parseInt(req.query.months) || 12;
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - (months - 1));
    monthsAgo.setHours(0, 0, 0, 0);

    // Helper to aggregate a collection by month
    const aggregateByMonth = async (collectionName) => {
      const dateFieldOptions = ['disposalDate', 'createdAt', 'lastUpdated', 'date'];
      let dateField = 'lastUpdated';
      
      const sample = await db.collection(collectionName).find({}).limit(1).toArray();
      if (sample && sample[0]) {
        for (const f of dateFieldOptions) {
          if (Object.prototype.hasOwnProperty.call(sample[0], f)) { 
            dateField = f; 
            break; 
          }
        }
      }

      const pipeline = [
        { $match: { [dateField]: { $type: 'date', $gte: monthsAgo } } },
        { $project: { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } } },
        { $group: { _id: { year: '$year', month: '$month' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ];

      const results = await db.collection(collectionName).aggregate(pipeline).toArray();
      return results;
    };

    // Use the same logic as React frontend - query disposals endpoint logic
    const getDisposalsByType = async (binType) => {
      try {
        const query = {
          binId: 'ESP32CAM-01',
          binType: binType,
          createdAt: { $type: 'date', $gte: monthsAgo }
        };

        const disposals = await db.collection('disposalHistory').find(query).toArray();
        return disposals;
      } catch (error) {
        console.error(`Error fetching ${binType} disposals:`, error);
        return [];
      }
    };

    const [hazardousDisposals, nonHazardousDisposals] = await Promise.all([
      getDisposalsByType('Hazardous'),
      getDisposalsByType('Non-Hazardous')
    ]);

    // Build month labels
    const labels = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Group disposals by month
    const groupByMonth = (disposals) => {
      const monthlyCounts = new Array(months).fill(0);
      
      disposals.forEach(disposal => {
        const disposalDate = new Date(disposal.createdAt || disposal.disposalDate || disposal.lastUpdated);
        const now = new Date();
        const monthsDiff = (now.getFullYear() - disposalDate.getFullYear()) * 12 + (now.getMonth() - disposalDate.getMonth());
        const index = months - 1 - monthsDiff;
        
        if (index >= 0 && index < months) {
          monthlyCounts[index]++;
        }
      });
      
      return monthlyCounts;
    };

    const hazardousSeries = groupByMonth(hazardousDisposals);
    const nonHazardousSeries = groupByMonth(nonHazardousDisposals);

    res.json({
      success: true,
      data: {
        labels,
        hazardous: hazardousSeries,
        nonHazardous: nonHazardousSeries
      }
    });
  } catch (error) {
    console.error('Monthly stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Summary stats endpoint for Flutter app
app.get('/api/waste/stats/summary', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const days = parseInt(req.query.days) || 30;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    daysAgo.setHours(0, 0, 0, 0);

    // Use the same logic as React frontend - query disposals endpoint logic
    const getDisposalsByType = async (binType) => {
      try {
        const query = {
          binId: 'ESP32CAM-01',
          binType: binType,
          createdAt: { $type: 'date', $gte: daysAgo }
        };

        const disposals = await db.collection('disposalHistory').find(query).toArray();
        return disposals.length;
      } catch (error) {
        console.error(`Error fetching ${binType} disposals:`, error);
        return 0;
      }
    };

    const [hazardousCount, nonHazardousCount] = await Promise.all([
      getDisposalsByType('Hazardous'),
      getDisposalsByType('Non-Hazardous')
    ]);
    
    const totalCount = hazardousCount + nonHazardousCount;

    res.json({
      success: true,
      data: {
        total: totalCount,
        hazardous: hazardousCount,
        nonHazardous: nonHazardousCount,
        period: `${days} days`,
        hazardousPercentage: totalCount > 0 ? Math.round((hazardousCount / totalCount) * 100) : 0,
        nonHazardousPercentage: totalCount > 0 ? Math.round((nonHazardousCount / totalCount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Summary stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/disposals/:id - Delete disposal record
app.delete('/api/disposals/:id', async (req, res) => {
  try {
    console.log('DELETE /api/disposals/:id - Deleting disposal record');
    console.log('Request params:', req.params);

    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid disposal record ID format"
      });
    }

    // Check if disposal record exists
    const existingRecord = await db.collection('disposalHistory').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: "Disposal record not found"
      });
    }

    // Delete the disposal record
    const result = await db.collection('disposalHistory').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Disposal record not found"
      });
    }

    console.log('Disposal record deleted successfully:', existingRecord.binType, existingRecord.binId);

    res.status(200).json({
      success: true,
      message: "Disposal record deleted successfully"
    });

  } catch (error) {
    console.error('Disposal record deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/disposals/bulk-delete - Bulk delete disposal records
app.delete('/api/disposals/bulk-delete', async (req, res) => {
  try {
    console.log('DELETE /api/disposals/bulk-delete - Bulk deleting disposal records');
    console.log('Request body:', req.body);

    // Database connection check
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database connection error" 
      });
    }

    const { deleteAll, binType } = req.body;

    let query = {};
    
    if (deleteAll) {
      // Delete all disposal records
      query = {};
    } else if (binType && ['Hazardous', 'Non-Hazardous'].includes(binType)) {
      // Delete records by bin type
      query = { binType: binType };
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid delete parameters. Must specify either deleteAll: true or valid binType"
      });
    }

    // Get count before deletion for response
    const countBefore = await db.collection('disposalHistory').countDocuments(query);

    if (countBefore === 0) {
      return res.status(404).json({
        success: false,
        error: "No records found matching the criteria"
      });
    }

    // Delete the records
    const result = await db.collection('disposalHistory').deleteMany(query);

    console.log(`Bulk delete completed: ${result.deletedCount} records deleted`);

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} disposal records`,
      deletedCount: result.deletedCount,
      criteria: deleteAll ? 'all records' : `${binType} records`
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/hazardous/:binId', async (req, res) => {
  try {
    const bin = await db.collection('Hazardous')
      .findOne({ id: parseInt(req.params.binId) });
    if (!bin) return res.status(404).json({ error: "Bin not found" });
    res.json(bin);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ======================
// Error Handling
// ======================
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: "Internal server error" });
});

// ======================
// Server Startup
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

(async () => {
  try {
    db = await connectToDatabase();
    console.log('Database connection established');
    
    // Create indexes
    await db.collection('disposalHistory').createIndex({ disposalDate: -1 });
    await db.collection('disposalHistory').createIndex({ binType: 1 });
    await db.collection('disposalHistory').createIndex({ 
      "garbageType": "text",
      "description": "text",
      "destination": "text"
    }, {
      weights: {
        garbageType: 3,
        destination: 2,
        description: 1
      },
      name: "TextSearchIndex"
    });

    // Create indexes for Announcements collection
    await db.collection('Announcements').createIndex({ createdAt: -1 });
    await db.collection('Announcements').createIndex({ status: 1 });
    await db.collection('Announcements').createIndex({ 
      "title": "text",
      "message": "text"
    }, {
      weights: {
        title: 3,
        message: 1
      },
      name: "AnnouncementTextSearchIndex"
    });
    
    // Create indexes for ComplianceReports collection
    await db.collection('ComplianceReports').createIndex({ createdAt: -1 });
    await db.collection('ComplianceReports').createIndex({ status: 1 });
    await db.collection('ComplianceReports').createIndex({ 
      "title": "text",
      "message": "text"
    }, {
      weights: {
        title: 3,
        message: 1
      },
      name: "ComplianceReportTextSearchIndex"
    });
    await db.collection('ComplianceReports').createIndex({ date: -1 });

    // Catch-all handler: send back React's index.html file for any non-API routes
    if (process.env.NODE_ENV === 'production') {
      app.use((req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
          return next();
        }
        // Serve React app for all other routes
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
      });
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('All endpoints are now available');
      
      // Start health monitoring
      setInterval(logHealthCheck, 30000); // Check every 30 seconds
      
      // Memory cleanup for TensorFlow
      setInterval(() => {
        if (typeof tf !== 'undefined' && tf.memory) {
          console.log('🧹 TensorFlow memory cleanup...');
          tf.memory().numTensors && console.log(`Tensors before cleanup: ${tf.memory().numTensors}`);
          tf.disposeVariables();
          console.log(`Tensors after cleanup: ${tf.memory().numTensors}`);
        }
      }, 60000); // Cleanup every minute
    });

  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
})();