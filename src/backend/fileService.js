import axios from "axios";
import getConfig from "../config/environment";

const config = getConfig();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/upload`;
const UPLOAD_PRESET = config.cloudinaryUploadPreset;
const SERVER_URL = config.serverUrl;

// Fallback: If upload preset doesn't work, we'll use unsigned upload
const UPLOAD_PRESET_FALLBACK = "ml_default";

export const uploadToCloudinary = async (file) => {
  // Try with the custom preset first
  let formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    // 1️⃣ Upload file to Cloudinary with custom preset
    const res = await axios.post(CLOUDINARY_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    if (!res.data.secure_url) {
      throw new Error("No secure URL returned from Cloudinary");
    }
    
    return {
      url: res.data.secure_url,
      public_id: res.data.public_id,
      filename: file.name,
      size: file.size
    };
  } catch (err) {
    console.warn("Custom preset failed, trying fallback:", err.response?.data?.error?.message);
    
    // Try with fallback preset
    try {
      formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET_FALLBACK);
      
      const res = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (!res.data.secure_url) {
        throw new Error("No secure URL returned from Cloudinary");
      }
      
      return {
        url: res.data.secure_url,
        public_id: res.data.public_id,
        filename: file.name,
        size: file.size
      };
    } catch (fallbackErr) {
      console.error("Both presets failed:", {
        custom: err.response?.data?.error?.message,
        fallback: fallbackErr.response?.data?.error?.message
      });
      
      throw new Error(`Cloudinary upload failed. Please check your upload preset configuration. Error: ${err.response?.data?.error?.message || err.message}`);
    }
  }
};

export const registerUpload = async (code, files) => {
  try {
    await axios.post(`${SERVER_URL}/api/register`, { code, files });
    return { success: true };
  } catch (err) {
    console.error("Registration failed:", err.message);
    throw new Error("Failed to register upload.");
  }
};

export const getFilesByCode = async (code) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/files/${code}`);
    
    console.log('Response data:', res.data);
    
    // Server returns { files: [...] }, extract the files array
    return res.data.files || [];
  } catch (err) {
    console.error("Retrieval error:", err.response?.data);
    throw new Error(err.response?.data?.error || "No files found for this code.");
  }
};
