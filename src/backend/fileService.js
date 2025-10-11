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
    
    console.log('Server response:', res.data);
    
    // Handle the new Cloudinary-based response format
    const files = res.data?.files || [];
    
    if (!Array.isArray(files)) {
      console.error('Files is not an array:', files);
      return [];
    }
    
    // Map files with proper properties from Cloudinary response
    return files.map(file => ({
      url: file.url || file.secure_url || null,
      filename: file.filename || file.public_id || 'Unknown file',
      public_id: file.public_id || null,
      content: file.content || null,
      type: file.type || file.resource_type || 'file',
      size: file.size || file.bytes || 0,
      format: file.format || null,
      sizeMB: file.size || file.bytes ? ((file.size || file.bytes) / (1024 * 1024)).toFixed(2) : '0'
    }));
  } catch (err) {
    console.error("Retrieval failed:", err);
    if (err.response?.status === 404) {
      throw new Error("No files found for this code.");
    }
    throw new Error("Failed to retrieve files.");
  }
};
