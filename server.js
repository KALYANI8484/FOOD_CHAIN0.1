import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
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

// Multer storage in memory
const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.includes('<db_password>')) {
  console.log('Using local MongoDB fallback as no password was provided in .env');
  MONGODB_URI = 'mongodb://127.0.0.1:27017/vikram_advertising';
}
console.log('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Please make sure a local MongoDB instance is running, or specify a valid MONGODB_URI with credentials in your .env file.');
  });

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
  status: { type: String, default: 'active' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, schemaOptions);

const masterItemSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  category: { type: String, required: true },
  image_url: { type: String, default: null },
  base_price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  description: { type: String, default: null },
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
  delivered_at: { type: String, default: null }
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
const SubAdmin = mongoose.model('SubAdmin', subAdminSchema, 'sub_admins');
const Plan = mongoose.model('Plan', planSchema, 'subscription_plans');
const MasterItem = mongoose.model('MasterItem', masterItemSchema, 'master_inventory');
const Vendor = mongoose.model('Vendor', vendorSchema, 'vendors');
const VendorItem = mongoose.model('VendorItem', vendorItemSchema, 'vendor_inventory');
const Order = mongoose.model('Order', orderSchema, 'orders');
const Guide = mongoose.model('Guide', guideSchema, 'guides');
const Settings = mongoose.model('Settings', settingsSchema, 'settings');
const Activity = mongoose.model('Activity', activitySchema, 'activity_log');
const UpgradeRequest = mongoose.model('UpgradeRequest', upgradeRequestSchema, 'upgrade_requests');
const ClientProfile = mongoose.model('ClientProfile', clientSchema, 'clients');

const models = {
  sub_admins: SubAdmin,
  subscription_plans: Plan,
  master_inventory: MasterItem,
  vendors: Vendor,
  vendor_inventory: VendorItem,
  orders: Order,
  guides: Guide,
  settings: Settings,
  activity_log: Activity,
  upgrade_requests: UpgradeRequest,
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
        if (planDoc && planDoc.max_clients > 0 && clientCount >= planDoc.max_clients) {
          vendorDoc.status = 'expired';
          await Activity.create({
            action: `Vendor ${vendorDoc.shop_name} plan expired (Max clients limit of ${planDoc.max_clients} reached)`,
            actor: 'System'
          });
          io.emit('vendorUpdated', { id: vendorDoc.id, status: 'expired' });
        }
        await vendorDoc.save();
      }
    }
  } catch (err) {
    console.error('Error checking plan limit:', err);
  }
}

// Upload file to AWS S3
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileKey = `${crypto.randomUUID()}-${req.file.originalname}`;
    const bucketName = process.env.AWS_BUCKET_NAME;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    res.json({ url });
  } catch (err) {
    console.error('S3 Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generic Database Handler matching Supabase JS queries
app.post('/api/db', async (req, res) => {
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
        if (table === 'orders') {
          docs = docs.map(d => {
            const obj = d.toJSON();
            if (obj.status === 'pending') {
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
            responseData = docs.length > 0 ? docs[0].toJSON() : null;
          } else {
            responseData = docs.map(d => d.toJSON());
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
            if (order.status === 'delivered') {
              await checkPlanLimitOnDelivery(order.id);
            }
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

        const docs = await Model.find(queryConditions);
        for (const doc of docs) {
          await doc.deleteOne();
        }
        responseData = { success: true, count: docs.length };
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

// Setup and Seed initial data if DB empty
app.post('/api/init-db', async (req, res) => {
  try {
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
