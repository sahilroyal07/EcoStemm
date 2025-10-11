# Secure File Share - Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   # Option 1: Use the start script (recommended)
   ./start.sh
   
   # Option 2: Start manually
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Features

✅ **User Authentication**
- JWT-based login/signup
- Secure password hashing with bcrypt
- Protected routes

✅ **File Upload & Sharing**
- Cloudinary integration for file storage
- Unique access codes for file sharing
- Drag & drop file upload

✅ **File Management**
- View and download shared files
- Star important files
- Recent files tracking

## Environment Variables

The `.env` file contains:
```
REACT_APP_CLOUDINARY_URL=https://api.cloudinary.com/v1_1/dugyjycjw/upload
REACT_APP_UPLOAD_PRESET=react_secure_share
REACT_APP_API_URL=http://localhost:5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
```

## Usage

1. **Sign Up/Login:** Create an account or login with existing credentials
2. **Upload Files:** Click "Upload New File" and drag/drop or select files
3. **Share Files:** Copy the generated access code and share with others
4. **Retrieve Files:** Use "Retrieve Files" with an access code to download shared files

## Tech Stack

- **Frontend:** React, Framer Motion, Lucide Icons
- **Backend:** Express.js, JWT, bcrypt
- **Storage:** Cloudinary
- **Styling:** Custom CSS with gradients and animations