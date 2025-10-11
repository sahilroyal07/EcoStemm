// server/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage (resets when server restarts)
const uploads = {};

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

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
