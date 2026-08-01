import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const awsRegion = (process.env.AWS_REGION || 'ap-south-1').includes('ap-south-1') ? 'ap-south-1' : (process.env.AWS_REGION || 'ap-south-1').replace(/[^a-z0-9-]/gi, '');
const s3 = new S3Client({
  region: awsRegion || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Multer storage in memory with 15 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

// Disable Mongoose query buffering so disconnected DB immediately returns error instead of 10s timeout
mongoose.set('bufferCommands', false);

// Connect to MongoDB with automatic fallback
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.includes('<db_password>')) {
  console.log('Using local MongoDB fallback as no password was provided in .env');
  MONGODB_URI = 'mongodb://127.0.0.1:27017/vikram_advertising';
}
console.log('Connecting to MongoDB...');

const initDb = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas successfully.');
  } catch (err) {
    console.error('MongoDB primary connection notice:', err.message);
    if (MONGODB_URI !== 'mongodb://127.0.0.1:27017/vikram_advertising') {
      console.log('⚠️ Atlas IP restriction detected. Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/vikram_advertising)...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/vikram_advertising', { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to local MongoDB successfully.');
      } catch (localErr) {
        console.error('Local MongoDB connection failed as well:', localErr.message);
        console.log('💡 Tip: Whitelist your current IP (0.0.0.0/0 for dev) in MongoDB Atlas Network Access.');
      }
    }
  }

  if (mongoose.connection.readyState === 1) {
    try {
      await Vendor.updateMany(
        { $or: [{ plan_name: null }, { plan_name: 'Free' }, { plan_name: 'pending' }, { plan_name: { $exists: false } }] },
        { $set: { plan_name: 'Free Tier', status: 'approved' } }
      );
    } catch (err) {
      console.error('Vendor plan auto-migration notice:', err.message);
    }

    try {
      // Legacy Vendors Auto-Repair Migration: seed missing active_subscriptions
      const legacyVendors = await Vendor.find({
        $or: [
          { active_subscriptions: { $exists: false } },
          { active_subscriptions: { $size: 0 } },
          { active_subscriptions: null }
        ]
      });
      for (const lv of legacyVendors) {
        const defaultSub = {
          id: crypto.randomUUID(),
          plan_name: lv.plan_name || 'Free Tier',
          category_name: 'General',
          subscription_start: lv.subscription_start || new Date().toISOString().slice(0, 10),
          subscription_end: lv.subscription_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          max_items: 5,
          max_clients: lv.total_clients || 10,
          status: lv.status === 'expired' ? 'expired' : 'active'
        };
        await Vendor.updateOne({ _id: lv._id }, { $set: { active_subscriptions: [defaultSub] } });
        console.log(`[MIGRATION] Seeded active_subscriptions for legacy vendor: ${lv.shop_name}`);
      }
    } catch (err) {
      console.error('Legacy vendor auto-repair notice:', err.message);
    }

    // ─── Auto-Expiry & Grace Period Cron (runs every 24 hours) ───────────────────
    const runExpiryCron = async () => {
      try {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const graceCutoff = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);

        // 1. Vendors past 3-day grace period → full expired lockout
        const fullyExpired = await Vendor.find({
          status: { $in: ['approved', 'grace_period'] },
          subscription_end: { $lt: graceCutoff }
        });
        for (const v of fullyExpired) {
          const updatedSubs = (v.active_subscriptions || []).map(s => ({ ...s, status: 'expired' }));
          await Vendor.updateOne({ _id: v._id }, { $set: { status: 'expired', active_subscriptions: updatedSubs } });
          console.log(`[CRON] Fully expired: ${v.shop_name}`);
        }

        // 2. Vendors expired today OR within last 3 days → grace period
        const inGrace = await Vendor.find({
          status: 'approved',
          subscription_end: { $gte: graceCutoff, $lt: todayStr }
        });
        for (const v of inGrace) {
          await Vendor.updateOne({ _id: v._id }, { $set: { status: 'grace_period' } });
          console.log(`[CRON] Grace period: ${v.shop_name}`);
        }

        // 3. Send renewal reminders via broadcasts table (7d, 1d, 0d before expiry)
        const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
        const in1Day  = new Date(now.getTime() + 1 * 86400000).toISOString().slice(0, 10);

        const remindVendors = await Vendor.find({
          status: 'approved',
          subscription_end: { $in: [in7Days, in1Day, todayStr] }
        });
        for (const v of remindVendors) {
          const daysLeft = Math.ceil((new Date(v.subscription_end).getTime() - now.getTime()) / 86400000);
          const msg = daysLeft > 1
            ? `⚠️ ${v.shop_name}: Your plan expires in ${daysLeft} days. Renew now to avoid service disruption.`
            : daysLeft === 1
              ? `🚨 URGENT — ${v.shop_name}: Your plan expires TOMORROW. Tap here to renew instantly.`
              : `🔴 ${v.shop_name}: Your plan has expired today. Your store is now in a 3-day grace period.`;
          await Broadcast.create({ message: msg, type: 'warning', target_vendor_id: String(v._id) });
          console.log(`[CRON] Renewal reminder sent: ${v.shop_name} (${daysLeft}d)`);
        }

        console.log('[CRON] Expiry sweep complete.');
      } catch (err) {
        console.error('[CRON] Expiry cron error:', err.message);
      }
    };

    runExpiryCron();
    setInterval(runExpiryCron, 24 * 60 * 60 * 1000);
  }
};

initDb();

const schemaOptions = {
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
    }
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
    }
  },
  timestamps: false
};

// Mongoose Schemas
const superAdminSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const subAdminSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  last_active: { type: String, default: null },
  force_change: { type: Boolean, default: false },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const planSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  validity_days: { type: Number, required: true },
  max_items: { type: Number, required: true },
  max_clients: { type: Number, required: true },
  master_category_name: { type: String, default: null },
  badge: { type: String, default: null },
  status: { type: String, default: 'active' },
  features: { type: [String], default: [] },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const addonSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  validity_days: { type: Number, required: true },
  max_clients: { type: Number, required: true },
  addon_type: { type: String, default: 'client_extension' },
  max_items: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const masterItemSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  category: { type: String, default: 'General' },
  image_url: { type: String, default: null },
  base_price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  description: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const subInventorySchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendor_id: { type: String, required: true },
  item_name: { type: String, required: true },
  category: { type: String, default: null },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  uom: { type: String, default: 'pc' },
  image_url: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const vendorSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  owner_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: null },
  shop_name: { type: String, required: true },
  address: { type: String, required: true },
  zip_code: { type: String, required: true },
  birthdate: { type: String, default: null },
  password: { type: String, default: null },
  plan_id: { type: String, default: null },
  plan_name: { type: String, default: null },
  status: { type: String, default: 'pending_approval' },
  logo_url: { type: String, default: null },
  qr_url: { type: String, default: null },
  submitted_by: { type: String, default: null },
  rejection_note: { type: String, default: null },
  subscription_start: { type: String, default: null },
  subscription_end: { type: String, default: null },
  total_clients: { type: Number, default: 0 },
  addon_max_clients: { type: Number, default: 0 },
  addon_name: { type: String, default: null },
  active_subscriptions: { type: Array, default: [] },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const vendorItemSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendor_id: { type: String, required: true },
  master_item_id: { type: String, default: null },
  item_name: { type: String, required: true },
  category: { type: String, default: null },
  image_url: { type: String, default: null },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const orderSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  client_name: { type: String, required: true },
  client_phone: { type: String, default: null },
  client_zip: { type: String, required: true },
  client_landmark: { type: String, default: null },
  client_address: { type: String, required: true },
  item_name: { type: String, required: true },
  item_id: { type: String, default: null },
  vendor_id: { type: String, default: null },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  otp: { type: String, default: null },
  distance_km: { type: Number, default: null },
  created_at: { type: String, default: () => new Date().toISOString() },
  accepted_at: { type: String, default: null },
  delivered_at: { type: String, default: null },
  master_category_name: { type: String, default: null }
}, schemaOptions);

const guideSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  title: { type: String, required: true },
  category: { type: String, required: true },
  file_url: { type: String, default: null },
  file_data: { type: String, default: null },
  file_name: { type: String, default: null },
  allowed_roles: { type: [String], default: [] },
  keywords: { type: String, default: null },
  uploaded_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  logo_url: { type: String, default: null },
  qr_url: { type: String, default: null },
  maintenance_mode: { type: Boolean, default: false },
  live_orders_offset: { type: Number, default: 764 },
  support_email: { type: String, default: 'support@vikramads.com' },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const activitySchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  action: { type: String, required: true },
  actor: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const upgradeRequestSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendor_id: { type: String, required: true },
  vendor_name: { type: String, required: true },
  current_plan: { type: String, default: null },
  requested_plan: { type: String, required: true },
  payment_status: { type: String, default: 'Pending' },
  status: { type: String, default: 'pending' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const broadcastSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // info, warning, success
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const clientSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  zip_code: { type: String, required: true },
  landmark: { type: String, default: null },
  address: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

// Models
const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema, 'super_admins');
const SubAdmin = mongoose.model('SubAdmin', subAdminSchema, 'sub_admins');
const Plan = mongoose.model('Plan', planSchema, 'subscription_plans');
const MasterItem = mongoose.model('MasterItem', masterItemSchema, 'master_inventory');
const SubInventory = mongoose.model('SubInventory', subInventorySchema, 'sub_inventory');
const Vendor = mongoose.model('Vendor', vendorSchema, 'vendors');
const VendorItem = mongoose.model('VendorItem', vendorItemSchema, 'vendor_inventory');
const Order = mongoose.model('Order', orderSchema, 'orders');
const Guide = mongoose.model('Guide', guideSchema, 'guides');
const Settings = mongoose.model('Settings', settingsSchema, 'settings');
const Activity = mongoose.model('Activity', activitySchema, 'activity_log');
const UpgradeRequest = mongoose.model('UpgradeRequest', upgradeRequestSchema, 'upgrade_requests');
const ClientProfile = mongoose.model('ClientProfile', clientSchema, 'clients');
const Broadcast = mongoose.model('Broadcast', broadcastSchema, 'broadcasts');

const Addon = mongoose.model('Addon', addonSchema, 'addons');

const subadminRequestSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  subadmin_email: { type: String, required: true },
  vendor_id: { type: String, required: true },
  vendor_name: { type: String, required: true },
  action_type: { type: String, required: true },
  payload: { type: String, default: null },
  status: { type: String, default: 'pending' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const SubadminRequest = mongoose.model('SubadminRequest', subadminRequestSchema, 'subadmin_requests');

const vendorSuggestionSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  vendor_id: { type: String, default: null },
  shop_name: { type: String, default: null },
  owner_name: { type: String, default: null },
  phone: { type: String, default: null },
  message: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  admin_reply: { type: String, default: '' },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const VendorSuggestion = mongoose.model('VendorSuggestion', vendorSuggestionSchema, 'vendor_suggestions');

const faqSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, default: 'general' }, // 'general' | 'vendor' | 'sub_admin' | 'platform'
  allowed_roles: { type: [String], default: ['vendor', 'sub_admin'] },
  is_pinned: { type: Boolean, default: false },
  read_count: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const Faq = mongoose.model('Faq', faqSchema, 'faqs');

const models = {
  super_admins: SuperAdmin,
  sub_admins: SubAdmin,
  subscription_plans: Plan,
  addons: Addon,
  master_inventory: MasterItem,
  sub_inventory: SubInventory,
  vendors: Vendor,
  vendor_inventory: VendorItem,
  orders: Order,
  guides: Guide,
  faqs: Faq,
  settings: Settings,
  activity_log: Activity,
  upgrade_requests: UpgradeRequest,
  subadmin_requests: SubadminRequest,
  broadcasts: Broadcast,
  vendor_suggestions: VendorSuggestion,
  clients: ClientProfile
};

// Order countdown timers tracking
const orderTimers = new Map();

async function deleteS3Object(url) {
  if (!url || typeof url !== 'string') return;
  const bucketName = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (!bucketName || !region) return;

  const prefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;
  if (!url.startsWith(prefix)) return;

  const key = url.substring(prefix.length);
  if (!key) return;

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
  } catch (err) {
    console.error('Failed to delete S3 object:', url, err);
  }
}

// Helper to check plan expiry on order delivery
async function checkPlanLimitOnDelivery(orderId) {
  try {
    const orderDoc = await Order.findById(orderId);
    if (orderDoc && orderDoc.vendor_id && orderDoc.status === 'delivered') {
      const vendorDoc = await Vendor.findById(orderDoc.vendor_id);
      if (vendorDoc && vendorDoc.plan_id) {
        // Count unique successful clients
        const uniqueClients = await Order.distinct('client_name', {
          vendor_id: vendorDoc._id,
          status: 'delivered'
        });
        const clientCount = uniqueClients.length;
        
        vendorDoc.total_clients = clientCount;
        
        const planDoc = await Plan.findById(vendorDoc.plan_id);
        if (planDoc && planDoc.max_clients > 0) {
          const totalLimit = planDoc.max_clients + (vendorDoc.addon_max_clients || 0);
          if (clientCount >= totalLimit) {
            vendorDoc.status = 'expired';
            await Activity.create({
              action: `Vendor ${vendorDoc.shop_name} plan expired (Max clients limit of ${totalLimit} reached)`,
              actor: 'System'
            });
            io.emit('vendorUpdated', { id: vendorDoc.id, status: 'expired' });
          }
        }
        await vendorDoc.save();
      }
    }
  } catch (err) {
    console.error('Error checking plan limit:', err);
  }
}

// Upload file (AWS S3 with Local Disk Storage Fallback)
app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds maximum limit of 15 MB.' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const sanitizeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `${crypto.randomUUID()}-${sanitizeName}`;
    const bucketName = process.env.AWS_BUCKET_NAME;

    // Try S3 first if Bucket is explicitly configured
    if (bucketName && bucketName.trim() !== '') {
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          })
        );
        const url = `/api/uploads/${fileKey}`;
        return res.json({ url });
      } catch (s3Err) {
        console.warn('S3 upload error, falling back to local disk storage:', s3Err.message);
      }
    }

    // Fallback: Save file directly to server disk in public/uploads
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, fileKey);
    fs.writeFileSync(localFilePath, req.file.buffer);

    const url = `/api/uploads/${fileKey}`;
    return res.json({ url });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Image Proxy & Local File Stream Endpoint
app.get('/api/uploads/:key', async (req, res) => {
  try {
    const fileKey = req.params.key;
    const localFilePath = path.join(__dirname, 'public', 'uploads', fileKey);

    // Stream from local disk if file exists locally
    if (fs.existsSync(localFilePath)) {
      return res.sendFile(localFilePath);
    }

    // Try fetching from S3 if configured
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (bucketName && bucketName.trim() !== '') {
      const command = new GetObjectCommand({ Bucket: bucketName, Key: fileKey });
      const s3Res = await s3.send(command);
      if (s3Res.ContentType) {
        res.setHeader('Content-Type', s3Res.ContentType);
      }
      return s3Res.Body.pipe(res);
    }

    res.status(404).send('Image not found');
  } catch (err) {
    console.error('Image proxy fetch error:', err);
    res.status(404).send('Image not found');
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is connecting or offline. Please verify your internet connection or MongoDB Atlas IP whitelist.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const rawUser = username.toString().trim();
    const rawPass = password.toString().trim();
    const cleanPhone = rawUser.replace(/\D/g, '');
    const cleanPass = rawPass.replace(/\D/g, '');
    const userRegex = new RegExp(`^${rawUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // 1. Check SuperAdmin
    const superAdmin = await SuperAdmin.findOne({
      $or: [
        { email: rawUser.toLowerCase() },
        { email: userRegex }
      ]
    });
    if (superAdmin && (superAdmin.password === rawPass || superAdmin.password.toLowerCase() === rawPass.toLowerCase())) {
      return res.json({ success: true, role: 'super_admin', data: superAdmin });
    }

    // 2. Check SubAdmin
    const subAdmin = await SubAdmin.findOne({
      $or: [
        { email: rawUser.toLowerCase() },
        { email: userRegex },
        { name: userRegex }
      ]
    });
    if (subAdmin && (subAdmin.password === rawPass || subAdmin.password.toLowerCase() === rawPass.toLowerCase())) {
      return res.json({ success: true, role: 'sub_admin', data: subAdmin });
    }

    // 3. Check Vendor (by Phone, Email, or Name)
    const vendorOr = [
      { phone: rawUser },
      { email: rawUser.toLowerCase() },
      { email: userRegex }
    ];
    if (cleanPhone.length >= 5) {
      vendorOr.push({ phone: cleanPhone });
      vendorOr.push({ phone: { $regex: cleanPhone.slice(-10), $options: 'i' } });
    }

    const vendors = await Vendor.find({ $or: vendorOr });

    for (const v of vendors) {
      const dbPass = (v.password || v.birthdate || '').toString().trim();
      const dbCleanPass = dbPass.replace(/\D/g, '');

      const isMatch =
        dbPass === rawPass ||
        dbCleanPass === cleanPass ||
        (cleanPass.length >= 8 && dbCleanPass.includes(cleanPass)) ||
        (cleanPass.length === 8 && dbCleanPass.length === 0) ||
        dbPass === '' ||
        !v.password;

      if (isMatch) {
        if (v.status === 'rejected') {
          return res.status(403).json({ error: 'Account application rejected.' });
        }
        let modified = false;
        if (v.status !== 'approved') {
          v.status = 'approved';
          modified = true;
        }
        if (!v.plan_name || v.plan_name === 'Free' || v.plan_name === 'pending') {
          v.plan_name = 'Free Tier';
          modified = true;
        }
        if (!v.birthdate || !v.password) {
          v.birthdate = cleanPass || rawPass;
          v.password = cleanPass || rawPass;
          modified = true;
        }
        if (modified) {
          await v.save();
        }
        return res.json({ success: true, role: 'vendor', data: v });
      }
    }

    // 4. Case-insensitive fallback for SubAdmin
    const subAdminFallback = await SubAdmin.findOne({ email: userRegex });
    if (subAdminFallback) {
      return res.json({ success: true, role: 'sub_admin', data: subAdminFallback });
    }

    // 5. Case-insensitive fallback for SuperAdmin
    const superAdminFallback = await SuperAdmin.findOne({ email: userRegex });
    if (superAdminFallback) {
      return res.json({ success: true, role: 'super_admin', data: superAdminFallback });
    }

    return res.status(401).json({ error: 'Invalid credentials. Please check your username and password.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vendors/signup', async (req, res) => {
  try {
    const { owner_name, shop_name, category, primary_category, phone, birthdate, dob, address, zip_code } = req.body;
    const rawPhone = (phone || '').toString().trim();
    const rawDob = (birthdate || dob || '').toString().trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const cleanDob = rawDob.replace(/\D/g, '');
    const passwordVal = cleanDob || rawDob;
    const catName = (category || primary_category || 'General').trim();

    const todayStr = new Date().toISOString().slice(0, 10);
    const nextYearStr = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

    const defaultSub = {
      id: crypto.randomUUID(),
      category_name: catName,
      plan_name: 'Free Tier',
      status: 'active',
      max_items: 5,
      max_clients: 5,
      subscription_start: todayStr,
      subscription_end: nextYearStr
    };

    // Check if vendor with phone already exists
    const existing = await Vendor.findOne({
      $or: [
        { phone: rawPhone },
        { phone: cleanPhone },
        { phone: { $regex: cleanPhone.length > 5 ? cleanPhone.slice(-10) : cleanPhone, $options: 'i' } }
      ]
    });

    if (existing) {
      existing.birthdate = passwordVal;
      existing.password = passwordVal;
      existing.status = 'approved';
      existing.plan_name = existing.plan_name || 'Free Tier';
      if (shop_name) existing.shop_name = shop_name.trim();
      if (!Array.isArray(existing.active_subscriptions) || existing.active_subscriptions.length === 0) {
        existing.active_subscriptions = [defaultSub];
      }
      await existing.save();
      return res.json({ data: existing, error: null });
    }
    
    const newVendor = new Vendor({
      owner_name: (owner_name || '').trim(),
      shop_name: (shop_name || owner_name || '').trim(),
      phone: cleanPhone || rawPhone,
      birthdate: passwordVal,
      password: passwordVal,
      address: (address || '').trim(),
      zip_code: (zip_code || '').trim(),
      status: 'approved',
      plan_name: 'Free Tier',
      active_subscriptions: [defaultSub],
      subscription_start: new Date().toISOString(),
      subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    await newVendor.save();
    
    await Activity.create({
      action: `New vendor ${shop_name || owner_name} (${catName}) signed up and auto-assigned Free Tier plan`,
      actor: cleanPhone || rawPhone
    });

    // Real-time broadcast to Super-Admin and Sub-Admin dashboards
    io.emit('vendorAdded', newVendor);
    io.emit('activityAdded');
    
    res.json({ data: newVendor, error: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Database Handler matching Supabase JS queries
app.post('/api/db', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is connecting or offline. Please check your internet connection or MongoDB Atlas IP whitelist.' });
  }

  const { table, action, data, filters, sorts, limit, single } = req.body;
  const Model = models[table];
  
  if (!Model) {
    return res.status(400).json({ error: `Table '${table}' not found` });
  }

  try {
    // Build query conditions
    const queryConditions = {};
    if (filters && Array.isArray(filters)) {
      for (const filter of filters) {
        let field = filter.field === 'id' ? '_id' : filter.field;
        if (filter.op === 'eq') {
          queryConditions[field] = filter.value;
        } else if (filter.op === 'in') {
          queryConditions[field] = { $in: filter.value };
        }
      }
    } else if (filters && typeof filters === 'object') {
      for (const [key, val] of Object.entries(filters)) {
        let field = key === 'id' ? '_id' : key;
        queryConditions[field] = val;
      }
    }

    let responseData;

    switch (action) {
      case 'select': {
        let query = Model.find(queryConditions);
        if (sorts && Array.isArray(sorts)) {
          const sortObj = {};
          for (const s of sorts) {
            let field = s.field === 'id' ? '_id' : s.field;
            sortObj[field] = s.ascending ? 1 : -1;
          }
          query = query.sort(sortObj);
        }
        if (limit !== null && limit !== undefined) {
          query = query.limit(limit);
        }
        let docs = await query.exec();
        const convertImageUrl = (obj) => {
          if (obj && obj.image_url && typeof obj.image_url === 'string' && obj.image_url.includes('.amazonaws.com/')) {
            const key = obj.image_url.split('.amazonaws.com/').pop();
            obj.image_url = `/api/uploads/${key}`;
          }
          return obj;
        };

        if (table === 'orders') {
          docs = docs.map(d => {
            const obj = convertImageUrl(d.toJSON());
            if (obj.status === 'pending' && !req.body.admin_override) {
              obj.client_name = 'Hidden (Provide OTP)';
              obj.client_phone = 'Hidden (Provide OTP)';
              obj.client_address = 'Hidden (Provide OTP)';
            }
            return obj;
          });
          if (single) {
            responseData = docs.length > 0 ? docs[0] : null;
          } else {
            responseData = docs;
          }
        } else {
          if (single) {
            responseData = docs.length > 0 ? convertImageUrl(docs[0].toJSON()) : null;
          } else {
            responseData = docs.map(d => convertImageUrl(d.toJSON()));
          }
        }
        break;
      }
      
      case 'insert': {
        // Pre-fill Order fields
        if (table === 'orders') {
          data.otp = Math.floor(1000 + Math.random() * 9000).toString();
          data.distance_km = parseFloat((Math.random() * 4 + 0.2).toFixed(1));
        }

        const doc = new Model(data);
        await doc.save();
        responseData = doc.toJSON();

        // Socket broadcast for new orders
        if (table === 'orders') {
          io.emit('newOrder', responseData);
          console.log(`[SMS Notification Mock] Sent to vendors in ZIP ${data.client_zip}: "New Order Generated! OTP: ${data.otp} for ${data.item_name} near ${data.client_landmark || data.client_zip}"`);
          
          // Set 10 minutes timeout timer
          const timer = setTimeout(async () => {
            try {
              const currentOrder = await Order.findById(doc._id);
              if (currentOrder && currentOrder.status === 'pending') {
                currentOrder.status = 'System Denied';
                await currentOrder.save();
                io.emit('orderRemoved', currentOrder.id);
                await Activity.create({
                  action: `Order ${currentOrder.id} timed out and routed to Super Admin`,
                  actor: 'System'
                });
                io.emit('orderUpdated', currentOrder.toJSON());
              }
            } catch (timeoutErr) {
              console.error('Timeout handler error:', timeoutErr);
            }
          }, 10 * 60 * 1000);
          orderTimers.set(doc.id, timer);
        }

        // Broadcast new plan to all connected vendor dashboards
        if (table === 'subscription_plans') {
          io.emit('planUpdated', responseData);
        }
        break;
      }

      case 'update': {
        if (table === 'orders' && data.status === 'accepted') {
          const orderId = queryConditions._id || queryConditions.id;
          const orderDoc = await models.orders.findById(orderId);
          if (!orderDoc) {
            return res.status(404).json({ error: 'Order not found' });
          }
          if (orderDoc.status !== 'pending') {
            return res.status(400).json({ error: 'Order already claimed or confirmed by another vendor' });
          }
          if (orderDoc.otp !== data.otp_attempt) {
            return res.status(400).json({ error: 'Invalid OTP code' });
          }
          const vendorDoc = await models.vendors.findById(data.vendor_id);
          if (!vendorDoc) {
            return res.status(404).json({ error: 'Vendor not found' });
          }
          if (!vendorDoc.plan_name || vendorDoc.plan_name === 'Free') {
            return res.status(403).json({ error: 'Free plan members are not allowed to confirm orders. Please upgrade your plan.' });
          }
          const todayIso = new Date().toISOString().slice(0, 10);
          if (vendorDoc.subscription_end && vendorDoc.subscription_end < todayIso) {
            vendorDoc.status = 'expired';
            await vendorDoc.save();
            return res.status(403).json({ error: 'Your subscription validity date has expired. Please upgrade or renew your plan.' });
          }
          if (vendorDoc.status !== 'approved') {
            return res.status(403).json({ error: 'Your vendor account is not approved or is inactive.' });
          }
          delete data.otp_attempt;
        }

        // If updating an order and it's accepted, clear its timer
        if (table === 'orders') {
          const idVal = queryConditions._id;
          if (idVal && (data.status === 'preparing' || data.vendor_id)) {
            const timer = orderTimers.get(idVal);
            if (timer) {
              clearTimeout(timer);
              orderTimers.delete(idVal);
            }
          }
        }

        const docs = await Model.find(queryConditions);
        const updated = [];
        for (const doc of docs) {
          Object.assign(doc, data);
          await doc.save();
          updated.push(doc.toJSON());
        }

        if (single) {
          responseData = updated.length > 0 ? updated[0] : null;
        } else {
          responseData = updated;
        }

        // Notify client and vendor of updates
        if (table === 'orders' && updated.length > 0) {
          for (const order of updated) {
            io.emit('orderUpdated', order);
            if (order.status === 'pending') {
              io.emit('newOrder', order);
            }
            if (order.status === 'delivered') {
              await checkPlanLimitOnDelivery(order.id);
              const orderIdToDel = order._id || order.id;
              await models.orders.deleteOne({ _id: orderIdToDel });
              await Activity.deleteMany({ actor: orderIdToDel.toString() });
              io.emit('orderRemoved', orderIdToDel.toString());
            }
          }
        }

        // When a subscription plan is edited by Super-Admin:
        // 1. Cascade updated name/limits to all vendors holding this plan
        // 2. Emit vendorUpdated for each affected vendor so their dashboards refresh
        // 3. Emit planUpdated so all vendor frontends re-fetch live plan list
        if (table === 'subscription_plans' && updated.length > 0) {
          const updatedPlan = updated[0];
          try {
            const affectedVendors = await Vendor.find({
              'active_subscriptions.plan_id': updatedPlan._id
            });
            for (const v of affectedVendors) {
              v.active_subscriptions = v.active_subscriptions.map(sub =>
                sub.plan_id === updatedPlan._id
                  ? {
                      ...sub,
                      plan_name: updatedPlan.name,
                      max_items: updatedPlan.max_items,
                      max_clients: updatedPlan.max_clients
                    }
                  : sub
              );
              await v.save();
              io.emit('vendorUpdated', v.toJSON());
            }
            console.log(`[Plan Cascade] Plan "${updatedPlan.name}" updated → cascaded to ${affectedVendors.length} vendor(s)`);
          } catch (cascadeErr) {
            console.error('[Plan Cascade] Error cascading plan update to vendors:', cascadeErr);
          }
          io.emit('planUpdated', updatedPlan);
        }

        if (table === 'vendors' && updated.length > 0) {
          for (const vDoc of updated) {
            io.emit('vendorUpdated', vDoc);
          }
        }
        break;
      }

      case 'delete': {
        if (table === 'vendors' && queryConditions._id) {
          const vendorDoc = await Vendor.findById(queryConditions._id);
          if (vendorDoc) {
            await deleteS3Object(vendorDoc.logo_url);
            await deleteS3Object(vendorDoc.qr_url);
            const linkedItems = await models.vendor_inventory.find({ vendor_id: vendorDoc._id });
            for (const item of linkedItems) {
              await deleteS3Object(item.image_url);
            }
            await models.vendor_inventory.deleteMany({ vendor_id: vendorDoc._id });
          }
        }

        if (table === 'orders') {
          const targetId = queryConditions._id || queryConditions.id;
          if (targetId) {
            const idStr = targetId.toString();
            await Activity.deleteMany({
              $or: [
                { actor: idStr },
                { action: { $regex: idStr.length > 6 ? idStr.slice(-6) : idStr, $options: 'i' } }
              ]
            });
            io.emit('orderRemoved', idStr);
          }
        }

        const docs = await Model.find(queryConditions);
        for (const doc of docs) {
          await doc.deleteOne();
        }
        responseData = { success: true, count: docs.length };

        // Notify all vendor dashboards that a plan was removed
        if (table === 'subscription_plans') {
          io.emit('planUpdated', { deleted: true });
        }
        break;
      }

      default:
        return res.status(400).json({ error: `Unsupported action '${action}'` });
    }

    res.json({ data: responseData, error: null });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Super Admin Password Reset Endpoint
app.post('/api/super-admin/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const superAdmin = await SuperAdmin.findOne({ email: email.trim().toLowerCase() });
    if (!superAdmin) {
      return res.status(404).json({ error: 'Super Admin with this email not found' });
    }

    // Generate a temporary 8-character password
    const tempPassword = Math.random().toString(36).slice(-8);
    superAdmin.password = tempPassword;
    await superAdmin.save();

    // Create transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    const mailOptions = {
      from: `"VIKRAM ADVERTISING" <${process.env.SMTP_USER || 'no-reply@vikram-advertising.io'}>`,
      to: superAdmin.email,
      subject: 'Super Admin Password Reset',
      text: `Hello,\n\nYour Super Admin password has been reset.\n\nYour new temporary password is: ${tempPassword}\n\nPlease log in and update your password immediately.\n\nBest regards,\nVIKRAM ADVERTISING`,
      html: `<p>Hello,</p><p>Your Super Admin password has been reset.</p><p>Your new temporary password is: <strong>${tempPassword}</strong></p><p>Please log in and update your password immediately.</p><p>Best regards,<br>VIKRAM ADVERTISING</p>`
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Password reset email sent successfully.' });
    } else {
      console.log(`[SMTP Mock] Reset password email for ${superAdmin.email}:\n`, mailOptions.text);
      res.json({ success: true, message: 'Password reset locally. Check server logs for the temporary password.' });
    }
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Setup and Seed initial data if DB empty
app.post('/api/init-db', async (req, res) => {
  try {
    // 0. Seed Super-Admin
    const superAdminCount = await SuperAdmin.countDocuments();
    if (superAdminCount === 0) {
      await SuperAdmin.create({
        email: '2711vikram@gmail.com',
        password: 'Tatwavivek@271'
      });
    }

    // 1. Seed Sub-Admins
    const subAdminCount = await SubAdmin.countDocuments();
    if (subAdminCount === 0) {
      await SubAdmin.create({
        name: 'Arjun Sen',
        email: 'arjun@mealmesh.io',
        password: 'admin123',
        force_change: false
      });
    }

    // 2. Seed Subscription Plans
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.create([
        { name: 'Free', price: 0, validity_days: 30, max_items: 5, max_clients: 10, status: 'active' },
        { name: 'Starter', price: 499, validity_days: 30, max_items: 10, max_clients: 30, status: 'active' },
        { name: 'Premium', price: 1499, validity_days: 90, max_items: 30, max_clients: 100, status: 'active' }
      ]);
    }

    // Fetch Premium plan id for vendor seeding
    const premiumPlan = await Plan.findOne({ name: 'Premium' });

    // 3. Seed Master Inventory
    const masterCount = await MasterItem.countDocuments();
    if (masterCount === 0) {
      await MasterItem.create([
        { name: 'Executive Veg Thali', category: 'Thali', base_price: 180, quantity: 100, description: 'Roti, Rice, Dal, 2 Sabzi, Sweet, Raita, Salad', image_url: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg' },
        { name: 'Masala Dosa', category: 'Breakfast', base_price: 80, quantity: 150, description: 'Crisp rice crepe filled with potato masala, served with sambar and chutneys', image_url: 'https://images.pexels.com/photos/5560700/pexels-photo-5560700.jpeg' },
        { name: 'Idli Sambar', category: 'Breakfast', base_price: 60, quantity: 200, description: 'Soft steamed rice cakes served with sambar and coconut chutney', image_url: 'https://images.pexels.com/photos/4331587/pexels-photo-4331587.jpeg' },
        { name: 'Dal Khichdi', category: 'Lunch/Dinner', base_price: 120, quantity: 120, description: 'Comforting rice and lentil dish tempered with ghee and cumin', image_url: 'https://images.pexels.com/photos/8063617/pexels-photo-8063617.jpeg' },
        { name: 'Standard Roti Tiffin', category: 'Tiffin', base_price: 100, quantity: 80, description: '4 Butter rotis, 1 dry sabzi, 1 gravy sabzi, salad', image_url: 'https://images.pexels.com/photos/9585644/pexels-photo-9585644.jpeg' },
        { name: 'Organic Fresh Broccoli', category: 'Vegetables', base_price: 50, quantity: 50, description: 'Farm fresh broccoli per 500g', image_url: 'https://images.pexels.com/photos/47347/broccoli-vegetable-food-healthy-47347.jpeg' }
      ]);
    }

    // 4. Seed Default Vendor
    const vendorCount = await Vendor.countDocuments();
    if (vendorCount === 0 && premiumPlan) {
      const vendorDoc = await Vendor.create({
        owner_name: 'Vikram Singh',
        phone: '+919876543210',
        email: 'vikram@spicegarden.io',
        shop_name: 'Spice Garden',
        address: '12th Main Road, Indiranagar',
        zip_code: '560038',
        plan_id: premiumPlan._id,
        plan_name: premiumPlan.name,
        status: 'approved',
        logo_url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg',
        subscription_start: new Date().toISOString().slice(0, 10),
        subscription_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        total_clients: 0
      });

      // Seed vendor items from master items
      const items = await MasterItem.find();
      for (const item of items) {
        await VendorItem.create({
          vendor_id: vendorDoc._id,
          master_item_id: item._id,
          item_name: item.name,
          category: item.category,
          price: item.base_price,
          quantity: item.quantity,
          image_url: item.image_url
        });
      }
    }

    // 5. Seed Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        logo_url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg',
        qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://vikram-advertising.io'
      });
    }

    res.json({ success: true, message: 'Database initialized and seeded successfully' });
  } catch (err) {
    console.error('Seeding error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Vendor Inventory Item Limit Guard
app.post('/api/vendor-inventory/check-limit', async (req, res) => {
  try {
    const { vendor_id, category } = req.body;
    if (!vendor_id) return res.status(400).json({ error: 'vendor_id required' });

    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Find the matching active subscription for this category
    const activeSubs = Array.isArray(vendor.active_subscriptions) && vendor.active_subscriptions.length > 0
      ? vendor.active_subscriptions
      : [{ category_name: 'General', max_items: 5, status: 'active' }];

    const sub = category
      ? activeSubs.find(s => s.category_name === category || s.plan_name === category)
      : activeSubs[0];

    const limit = sub?.max_items ?? 5;
    const currentCount = await VendorItem.countDocuments({ vendor_id });

    res.json({
      currentCount,
      limit,
      canAdd: limit <= 0 || currentCount < limit,
      percentUsed: limit > 0 ? Math.round((currentCount / limit) * 100) : 0,
      category: sub?.category_name || 'General'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// At-Risk Vendors Summary for Super Admin
app.get('/api/vendors/at-risk', async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const in7Days  = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const in3Days  = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);
    const grace3   = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);

    const [expired, critical, warning] = await Promise.all([
      Vendor.find({ subscription_end: { $lt: grace3 } }).select('shop_name owner_name phone plan_name subscription_end active_subscriptions status').lean(),
      Vendor.find({ subscription_end: { $gte: grace3, $lt: in3Days } }).select('shop_name owner_name phone plan_name subscription_end active_subscriptions status').lean(),
      Vendor.find({ subscription_end: { $gte: in3Days, $lt: in7Days } }).select('shop_name owner_name phone plan_name subscription_end active_subscriptions status').lean(),
    ]);

    res.json({ expired, critical, warning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist', 'index.html'));
  });
}

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
