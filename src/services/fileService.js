import axios from "axios";
import getConfig from "../config/environment";

const config = getConfig();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/upload`;
const UPLOAD_PRESET = config.cloudinaryUploadPreset;
const SERVER_URL = config.serverUrl;

export const uploadToCloudinary = async (file, code) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("tags", `code_${code}`);
  formData.append("context", `access_code=${code}`);

  try {
    const res = await axios.post(CLOUDINARY_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    return {
      url: res.data.secure_url,
      public_id: res.data.public_id,
      filename: file.name,
      size: file.size,
      code: code
    };
  } catch (err) {
    throw new Error(`Upload failed: ${err.message}`);
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
