const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '5gb' }));
app.use(bodyParser.urlencoded({ limit: '5gb', extended: true }));

// Persistent user storage
const USERS_FILE = './users.json';
let users = [];

// Load users from file
if (fs.existsSync(USERS_FILE)) {
  try {
    const userData = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(userData);
    console.log(`📂 Loaded ${users.length} users from storage`);
  } catch (error) {
    console.log('Error loading users, starting fresh:', error.message);
    users = [];
  }
} else {
  console.log('No users file found, starting fresh');
  users = [];
}

// Save users to file
const saveUsers = () => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check if user exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword
    };
    users.push(user);
    saveUsers();
    console.log('New user created:', email);

    // Generate token
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: { id: user.id, email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user.id, email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// File sharing routes (public for cross-device sharing)
app.post('/api/register', async (req, res) => {
  const { code, files } = req.body;

  if (!code || !files) {
    return res.status(400).json({ error: 'Missing code or files' });
  }

  try {
    console.log(`📝 Registering code ${code} with files:`, files);
    
    // Store metadata in Cloudinary for each file
    for (const file of files) {
      if (file.public_id) {
        console.log(`🏷️ Adding tag code_${code} to ${file.public_id}`);
        
        try {
          await cloudinary.uploader.add_tag(`code_${code}`, file.public_id);
          console.log(`✅ Tag added successfully to ${file.public_id}`);
          
          await cloudinary.uploader.add_context(`access_code=${code}|created_at=${new Date().toISOString()}`, file.public_id);
          console.log(`✅ Context added successfully to ${file.public_id}`);
        } catch (tagError) {
          console.error(`❌ Error tagging ${file.public_id}:`, tagError);
        }
      } else {
        console.log(`⚠️ File missing public_id:`, file);
      }
    }
    
    console.log(`✅ Registered code ${code} -> ${files.length} file(s) in Cloudinary`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error registering files:', error);
    res.status(500).json({ error: 'Failed to register files' });
  }
});

app.get('/api/files/:code', async (req, res) => {
  const { code } = req.params;
  console.log(`🔍 Looking for code: ${code}`);
  
  try {
    // First try Cloudinary search for new uploads
    console.log('Searching Cloudinary for tagged files...');
    const result = await cloudinary.search
      .expression(`tags:code_${code}`)
      .with_field('context')
      .max_results(100)
      .execute();
    
    console.log('Cloudinary search result:', result);
    
    if (result.resources && result.resources.length > 0) {
      // Format files for response
      const files = result.resources.map(resource => ({
        url: resource.secure_url,
        public_id: resource.public_id,
        filename: resource.filename || resource.public_id,
        type: resource.resource_type,
        size: resource.bytes,
        format: resource.format
      }));
      
      console.log(`📦 Found ${files.length} file(s) in Cloudinary for code ${code}`);
      return res.json({ files });
    }
    
    console.log(`❌ No files found for code: ${code}`);
    return res.status(404).json({ error: 'No files found for this code' });
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Get Cloudinary storage usage (accessible to all authenticated users)
app.get('/api/storage', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching Cloudinary usage...');
    const usage = await cloudinary.api.usage();
    console.log('Cloudinary usage response:', JSON.stringify(usage, null, 2));
    
    const usedBytes = usage.storage?.used_bytes || 0;
    const limitBytes = usage.storage?.limit || 26843545600; // 25GB default
    
    const response = {
      used: usedBytes,
      limit: limitBytes,
      usedMB: (usedBytes / (1024 * 1024)).toFixed(2),
      limitGB: (limitBytes / (1024 * 1024 * 1024)).toFixed(2)
    };
    
    console.log('Sending storage response:', response);
    res.json(response);
  } catch (error) {
    console.error('Cloudinary API error:', error.message);
    
    // Return mock data if Cloudinary API fails
    const mockResponse = {
      used: 157286400, // ~150MB mock usage
      limit: 26843545600, // 25GB limit
      usedMB: '150.00',
      limitGB: '25.00'
    };
    
    console.log('Using mock storage data:', mockResponse);
    res.json(mockResponse);
  }
});

// Developer-only: Clear all Cloudinary storage
app.delete('/api/storage/clear', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    if (!user || user.email !== 'dev@secureshare.com') {
      return res.status(403).json({ error: 'Developer access only' });
    }

    const resources = await cloudinary.api.resources({ max_results: 500 });
    const deletePromises = resources.resources.map(resource => 
      cloudinary.uploader.destroy(resource.public_id)
    );
    
    await Promise.all(deletePromises);
    
    // Clear all files from Cloudinary
    // (Files are already being deleted above)
    
    res.json({ message: 'All storage cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear storage' });
  }
});

// Upload to Cloudinary (signed)
app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    
    const uploadResult = await cloudinary.uploader.upload(fileData, {
      public_id: `${Date.now()}_${fileName}`,
      resource_type: 'auto'
    });
    
    res.json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      filename: fileName
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'EcoSystem Backend API',
    status: 'running',
    endpoints: {
      test: '/api/test',
      auth: '/api/auth/login',
      files: '/api/files/:code'
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Debug route to check Cloudinary
app.get('/api/debug/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await cloudinary.search
      .expression(`tags:code_${code}`)
      .with_field('context')
      .max_results(100)
      .execute();
    
    res.json({ 
      searchExpression: `tags:code_${code}`,
      totalCount: result.total_count,
      resources: result.resources 
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Admin route to delete users (developer only)
app.delete('/api/admin/users/:email', authenticateToken, async (req, res) => {
  try {
    const adminUser = users.find(u => u.id === req.user.userId);
    if (!adminUser || adminUser.email !== 'dev@secureshare.com') {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const emailToDelete = req.params.email;
    const userIndex = users.findIndex(u => u.email === emailToDelete);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    saveUsers();
    
    res.json({ message: `User ${emailToDelete} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Create default users only if they don't exist
  const testExists = users.find(u => u.email === 'test@test.com');
  const devExists = users.find(u => u.email === 'dev@secureshare.com');
  
  if (!testExists) {
    const testPassword = await bcrypt.hash('test123', 10);
    users.push({
      id: users.length + 1,
      email: 'test@test.com',
      password: testPassword
    });
    console.log('✅ Test user created: test@test.com / test123');
  }
  
  if (!devExists) {
    const devPassword = await bcrypt.hash('dev123', 10);
    users.push({
      id: users.length + 1,
      email: 'dev@secureshare.com',
      password: devPassword
    });
    console.log('✅ Developer user created: dev@secureshare.com / dev123');
  }
  
  if (!testExists || !devExists) {
    saveUsers();
  }
  
  console.log(`💾 Total users in system: ${users.length}`);
  
  // List existing users (without passwords)
  users.forEach(user => {
    console.log(`- User: ${user.email} (ID: ${user.id})`);
  });
});

const server = app;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});