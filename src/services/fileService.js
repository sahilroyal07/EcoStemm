import axios from "axios";
import getConfig from "../config/environment";

const config = getConfig();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/upload`;
const UPLOAD_PRESET = config.cloudinaryUploadPreset;
const SERVER_URL = config.serverUrl;

export const uploadToCloudinary = async (file, code) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('code', code);

    const token = localStorage.getItem('token');
    const res = await axios.post(`${SERVER_URL}/api/upload`, formData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return {
      url: res.data.url,
      public_id: res.data.public_id,
      filename: file.name,
      size: file.size
    };
  } catch (err) {
    console.error('Upload error:', err.response?.data);
    throw new Error(err.response?.data?.error || "Upload failed");
  }
};

export const registerUpload = async (code, files) => {
  try {
    await axios.post(`${SERVER_URL}/api/register`, { code, files });
    return { success: true };
  } catch (err) {
    throw new Error("Failed to register upload.");
  }
};

export const getFilesByCode = async (code) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/files/${code}`);
    return res.data.files || [];
  } catch (err) {
    throw new Error(err.response?.data?.error || "No files found for this code.");
  }
};
