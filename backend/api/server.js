// Pure Cloudinary backend (no Firebase)
import fs from "fs";
import path from "path";

const CLOUD_NAME = "dugyjycjw";
const UPLOAD_PRESET = "react_secure_share"; // unsigned preset
const API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
const DB_PATH = "./uploads.json";

// Utility functions for file-based storage
const readDB = () => (fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH)) : {});
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

/**
 * Uploads a single file to Cloudinary
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Cloudinary upload failed");
  const data = await response.json();

  return {
    public_id: data.public_id,
    url: data.secure_url,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Registers uploads (file-based storage for retrieval)
 * Each code corresponds to uploaded files stored in JSON file.
 */
export async function registerUpload(code, files) {
  const existing = readDB();
  existing[code] = files;
  writeDB(existing);
  return true;
}

/**
 * Retrieves files from JSON file based on access code
 */
export async function retrieveFilesByCode(code) {
  const existing = readDB();
  return existing[code] || [];
}


