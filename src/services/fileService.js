import axios from "axios";
import getConfig from "../config/environment";
import crypto from "../utils/crypto";

const config = getConfig();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/upload`;
const UPLOAD_PRESET = config.cloudinaryUploadPreset;
const SERVER_URL = config.serverUrl;

export const uploadToCloudinary = async (file, code) => {
  try {
    console.log('Starting upload:', { filename: file.name, size: file.size, code });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('code', code);

    console.log('Server URL:', SERVER_URL);
    
    const res = await axios.post(`${SERVER_URL}/api/upload`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 minutes timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });
    
    console.log('Upload successful:', res.data);
    
    return {
      url: res.data.url,
      public_id: res.data.public_id,
      filename: file.name,
      size: file.size
    };
  } catch (err) {
    console.error('Upload error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      url: `${SERVER_URL}/api/upload`
    });
    
    if (err.code === 'ECONNABORTED') {
      throw new Error('Upload timeout - file too large or slow connection');
    }
    
    throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || "Upload failed");
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

export const getCloudinaryStorageUsage = async () => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = crypto
      .createHash("sha256")
      .update(`timestamp=${timestamp}${config.cloudinaryApiSecret}`)
      .digest("hex");

    const res = await axios.get(
      `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/usage`,
      {
        params: {
          timestamp,
          signature,
          api_key: config.cloudinaryApiKey,
        },
      }
    );

    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.error?.message || "Failed to fetch Cloudinary storage usage."
    );
  }
};
