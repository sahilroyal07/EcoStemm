// Production-ready server for cross-platform deployment
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./server/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration for cross-platform access
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false // In production, only allow same-origin requests
    : true, // In development, allow all origins
  credentials: true
}));

app.use(bodyParser.json());

// Mount authentication routes
app.use("/api/auth", authRoutes);

// In-memory storage (for demo - replace with database in production)
const uploads = {};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Register a file code and its files
app.post("/api/register", (req, res) => {
  const { code, files } = req.body;

  if (!code || !files) {
    return res.status(400).json({ error: "Missing code or files" });
  }

  uploads[code] = files;
  console.log(`✅ Registered code ${code} -> ${files.length} file(s)`);
  res.json({ success: true });
});

// Retrieve files by code
app.get("/api/files/:code", (req, res) => {
  const { code } = req.params;
  const files = uploads[code];

  if (!files) return res.status(404).json({ error: "No files found for this code" });

  console.log(`📦 Retrieved code ${code} -> ${files.length} file(s)`);
  res.json({ files });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for cross-platform access`);
});
