import axios from "axios";
import getConfig from "../config/environment";

const config = getConfig();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/upload`;
const UPLOAD_PRESET = config.cloudinaryUploadPreset;
const SERVER_URL = config.serverUrl;

export const uploadToCloudinary = async (file, code) => {
  try {
    const reader = new FileReader();
    const fileData = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const token = localStorage.getItem('token');
    const res = await axios.post(`${SERVER_URL}/api/upload`, 
      { fileData, fileName: file.name, code },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return {
      url: res.data.url,
      public_id: res.data.public_id,
      filename: file.name,
      size: file.size
    };
  } catch (err) {
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
