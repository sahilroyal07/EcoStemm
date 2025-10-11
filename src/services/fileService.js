import axios from "axios";
import api from "./api";

const CLOUDINARY_URL = process.env.REACT_APP_CLOUDINARY_URL;
const UPLOAD_PRESET = process.env.REACT_APP_UPLOAD_PRESET;

// Fallback: If upload preset doesn't work, we'll use unsigned upload
const UPLOAD_PRESET_FALLBACK = "ml_default";

export const uploadToCloudinary = async (file) => {
  try {
    // Convert file to base64
    const fileData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    // Upload via server
    const res = await api.post('/api/upload', {
      fileData,
      fileName: file.name
    });
    
    return {
      url: res.data.url,
      public_id: res.data.public_id,
      filename: file.name,
      size: file.size
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Upload failed: ' + (error.response?.data?.error || error.message));
  }
};

export const registerUpload = async (code, files) => {
  try {
    await api.post('/api/register', { code, files });
    return { success: true };
  } catch (err) {
    console.error("Registration failed:", err.message);
    throw new Error("Failed to register upload.");
  }
};

export const getFilesByCode = async (code) => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${code}`);
    return res.data.files;
  } catch (err) {
    console.error("Retrieval failed:", err.message);
    throw new Error("No file found for this code.");
  }
};
