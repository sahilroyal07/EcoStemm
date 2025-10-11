import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Cloudinary user storage (folder)
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUDNAME}/auto/upload`;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

// Simple JWT secret (use env variable in production)
const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

// Temporary in-memory user cache (Cloudinary used as storage)
const uploadUserToCloudinary = async (userData) => {
  const blob = new Blob([JSON.stringify(userData)], { type: "application/json" });
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", `users/${userData.email.replace(/[@.]/g, "_")}`);

  const res = await axios.post(CLOUDINARY_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.secure_url;
};

const getUserFromCloudinary = async (email) => {
  try {
    const publicId = `users/${email.replace(/[@.]/g, "_")}`;
    const res = await axios.get(
      `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUDNAME}/raw/upload/${publicId}.json`
    );
    return res.data;
  } catch {
    return null;
  }
};

// ➤ SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const existing = await getUserFromCloudinary(email);
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = { email, password: hashed, createdAt: Date.now() };
  await uploadUserToCloudinary(newUser);

  res.json({ success: true, message: "Signup successful" });
});

// ➤ LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserFromCloudinary(email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid password" });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

export default router;
