import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Star, Clock, Download, File, MoreVertical, HardDrive, Zap, Home, User, Settings } from "lucide-react";
import { uploadToCloudinary, registerUpload, getFilesByCode } from "../services/fileService";
import api from "../services/api";
import HomePage from "./HomePage";
import QRCode from 'qrcode';
import { BrowserMultiFormatReader } from '@zxing/library';

const MainApp = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('home');
  const [cloudinaryStorage, setCloudinaryStorage] = useState({ usedMB: 245, limitGB: 25 });
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [starredFiles, setStarredFiles] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRetrieveOpen, setIsRetrieveOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [retrieveCode, setRetrieveCode] = useState("");
  const [retrieveLoading, setRetrieveLoading] = useState(false);
  const [retrieveError, setRetrieveError] = useState("");
  const [retrievedFiles, setRetrievedFiles] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(() => {
    return localStorage.getItem('generatedCode') || "";
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isQRScanOpen, setIsQRScanOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState(() => {
    return localStorage.getItem('qrCodeImage') || '';
  });
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const [textContent, setTextContent] = useState('');
  const [isTextUploadOpen, setIsTextUploadOpen] = useState(false);

  const calculateFileSizeMB = (files) =>
    files.reduce((t, f) => t + f.size / (1024 * 1024), 0);

  const getStoragePercentage = () => {
    const maxStorageMB = cloudinaryStorage.limitGB * 1024;
    return Math.min((cloudinaryStorage.usedMB / maxStorageMB) * 100, 100);
  };

  const getRemainingStorageGB = () => {
    const maxStorageMB = cloudinaryStorage.limitGB * 1024;
    const remainingMB = Math.max(maxStorageMB - cloudinaryStorage.usedMB, 0);
    return (remainingMB / 1024).toFixed(2);
  };

  const fetchCloudinaryStorage = async () => {
    // Simulate storage usage based on uploads
    const currentUsage = uploadedFiles.length * 50 + recentFiles.length * 30 + 245;
    setCloudinaryStorage({ 
      usedMB: Math.min(currentUsage, 25000), // Max 25GB
      limitGB: 25 
    });
  };

  const clearAllStorage = async () => {
    if (!isDeveloper) return;
    
    const confirmed = window.confirm('⚠️ This will clear all files and reset storage. Are you sure?');
    if (!confirmed) return;
    
    setUploadedFiles([]);
    setRecentFiles([]);
    setStarredFiles([]);
    setCloudinaryStorage({ usedMB: 0, limitGB: 25 });
    alert('✅ All storage cleared successfully!');
  };

  useEffect(() => {
    fetchCloudinaryStorage();
    
    // Check if user is developer (only they see delete button)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsDeveloper(user.email === 'dev@secureshare.com');
    
    // Check for code in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      // Auto-retrieve files from URL code
      getFilesByCode(codeFromUrl).then(files => {
        if (files && files.length > 0) {
          const newFiles = files.map(f => ({
            ...f,
            code: codeFromUrl,
            filename: f.filename || f.public_id || 'Unknown file',
            url: f.url || f.secure_url,
            type: f.type || f.resource_type || 'file',
            size: f.size || f.bytes || 0
          }));
          setRecentFiles(prev => [...newFiles, ...prev]);
        }
      }).catch(err => {
        console.error('Failed to retrieve files from URL:', err);
      });
      // Clear URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleUpload = async () => {
    console.log("Upload button clicked, files:", uploadFiles);
    if (!uploadFiles || uploadFiles.length === 0) {
      console.log("No files selected");
      return alert("Please select at least one file!");
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log("Generated code:", code);

    try {
      console.log("Starting upload to Cloudinary...");
      setIsUploading(true);
      setUploadProgress(10);
      const uploadedResults = await Promise.all(
        uploadFiles.map(async (f) => {
          const res = await uploadToCloudinary(f, code);
          setUploadProgress((p) => Math.min(90, p + Math.ceil(80 / Math.max(1, uploadFiles.length))));
          return res;
        })
      );
      console.log("Upload results:", uploadedResults);

      // Update storage display
      fetchCloudinaryStorage();

      console.log("Registering upload with server...");
      await registerUpload(
        code,
        uploadedResults.map((f) => ({ public_id: f.public_id, url: f.url }))
      );

      const withCode = uploadedResults.map((f) => ({ ...f, code }));
      setUploadedFiles((prev) => [...withCode, ...prev]);
      setUploadFiles([]);
      setUploadProgress(100);
      setGeneratedCode(code);
      localStorage.setItem('generatedCode', code);
      
      // Generate QR code
      try {
        const qrDataURL = await QRCode.toDataURL(code, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeImage(qrDataURL);
        localStorage.setItem('qrCodeImage', qrDataURL);
      } catch (error) {
        console.error('QR code generation failed:', error);
      }
      
      setIsUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const spreadsheetExts = ['xlsx', 'xls', 'csv'];
    const presentationExts = ['ppt', 'pptx'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
    
    if (imageExts.includes(ext)) return '🖼️';
    if (videoExts.includes(ext)) return '🎥';
    if (audioExts.includes(ext)) return '🎵';
    if (docExts.includes(ext)) return '📄';
    if (spreadsheetExts.includes(ext)) return '📊';
    if (presentationExts.includes(ext)) return '📋';
    if (archiveExts.includes(ext)) return '📦';
    return '📁';
  };

  const onFilesChosen = (filesLike) => {
    const arr = Array.from(filesLike || []);
    setUploadFiles(arr);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      onFilesChosen(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) return alert("Please enter some text!");

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      setIsUploading(true);
      
      // Create a text "file" object
      const textData = {
        content: textContent,
        type: 'text',
        timestamp: new Date().toISOString()
      };
      
      await registerUpload(code, [textData]);
      
      // Generate QR code for text
      const qrDataURL = await QRCode.toDataURL(code, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      
      setQrCodeImage(qrDataURL);
      localStorage.setItem('qrCodeImage', qrDataURL);
      setGeneratedCode(code);
      localStorage.setItem('generatedCode', code);
      setTextContent('');
      setIsTextUploadOpen(false);
      setIsUploadOpen(true); // Show the code/QR modal
      setIsUploading(false);
    } catch (err) {
      console.error("Text upload error:", err);
      alert("Text upload failed: " + err.message);
      setIsUploading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!retrieveCode) return alert("Please enter an access code!");

    console.log('Starting retrieve with code:', retrieveCode);
    try {
      setRetrieveLoading(true);
      setRetrieveError("");
      const filesFound = await getFilesByCode(retrieveCode);
      console.log('Files retrieved:', filesFound);
      
      // Handle any response format
      console.log('Files found:', filesFound);
      
      // Ensure filesFound is an array
      const fileArray = Array.isArray(filesFound) ? filesFound : [];
      
      const newRecent = fileArray.map((f) => {
        console.log('Processing file:', f);
        return {
          ...f,
          code: retrieveCode,
          filename: f?.filename || f?.public_id || 'Unknown file',
          url: f?.url || f?.secure_url || f?.public_id || null,
          content: f?.content || null,
          type: f?.type || f?.resource_type || 'file',
          size: f?.size || f?.bytes || 0,
          sizeMB: f?.size ? (f.size / (1024 * 1024)).toFixed(2) : (f?.bytes ? (f.bytes / (1024 * 1024)).toFixed(2) : '0')
        };
      });
      console.log('Mapped files:', newRecent);
      
      // Set retrieved files for modal display
      setRetrievedFiles(newRecent);
      
      setRecentFiles((r) => {
        const combined = [...newRecent, ...r];
        const seen = new Set();
        return combined.filter((it) => {
          if (!it.url && !it.content) return false;
          const key = it.url || it.content || it.filename;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      console.log('Retrieve successful, keeping modal open');
      // Keep modal open to show retrieved files
    } catch (err) {
      console.error('Retrieve error:', err);
      setRetrieveError(err.message || "No content found for this code.");
    } finally {
      setRetrieveLoading(false);
    }
  };

  const handleDeleteRecent = (file) => {
    setRecentFiles((r) => r.filter((it) => it.url !== file.url));
  };

  const handleRemoveUploaded = (file) => {
    setUploadedFiles((prev) => prev.filter((p) => p.url !== file.url));
  };

  const toggleStar = (file) => {
    setStarredFiles((prev) => {
      const isStarred = prev.some(f => f.url === file.url);
      if (isStarred) {
        return prev.filter(f => f.url !== file.url);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleDownload = async (url, filename) => {
    console.log('Download attempt:', { url, filename });
    if (!url || !url.startsWith('http')) {
      console.error('Invalid URL:', url);
      alert('Cannot download: Invalid file URL');
      return;
    }
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    }
  };

  const handleDownloadAll = async () => {
    if (uploadedFiles.length === 0) {
      return alert("No files available for download.");
    }

    try {
      const response = await fetch("http://localhost:5000/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: uploadedFiles }),
      });

      if (!response.ok) {
        throw new Error("Failed to download files.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "files.zip";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download files.");
    }
  };

  const StorageBlock = () => {
    const percentage = getStoragePercentage();
    const remaining = getRemainingStorageGB();
    
    return (
      <div className="storage-block">
        <div className="storage-header">
          <HardDrive size={24} color="#4b6bfb" />
          <h3>Storage Usage</h3>
        </div>
        
        <div className="storage-stats">
          <div className="storage-numbers">
            <span className="used">{(cloudinaryStorage.usedMB / 1024).toFixed(2)} GB used</span>
            <span className="total">of {cloudinaryStorage.limitGB} GB</span>
          </div>
          
          <div className="storage-debug">
            <small style={{color: '#6b7280', fontSize: '0.75rem'}}>
              Raw: {cloudinaryStorage.usedMB}MB / {cloudinaryStorage.limitGB}GB
            </small>
          </div>
          
          <div className="storage-bar">
            <div
              className="storage-fill"
              style={{
                width: `${percentage}%`,
                background: percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
          
          <div className="storage-remaining">
            <Zap size={16} />
            <span>{remaining} GB remaining</span>
          </div>
          
          {isDeveloper && (
            <button
              className="clear-storage-btn"
              onClick={clearAllStorage}
            >
              🗑️ Clear All Storage (Dev Only)
            </button>
          )}
        </div>
      </div>
    );
  };

  const FileCard = ({ file, onDelete, showStar = false }) => {
    const [open, setOpen] = useState(false);
    const menuRef = React.useRef();

    useEffect(() => {
      const onDoc = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("click", onDoc);
      return () => document.removeEventListener("click", onDoc);
    }, []);

    const isStarred = starredFiles.some(f => f.url === file.url);

    return (
      <motion.div
        className="file-card"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="file-left">
          <div className="file-type-icon">
            {file.type === 'text' ? '📝' : getFileIcon(file.filename || '')}
          </div>
          <div className="file-meta">
            <p className="file-name">
              {file.type === 'text' ? 'Shared Text' : file.filename}
            </p>
            <p className="file-size">
              {file.type === 'text' ? `${file.content?.length || 0} characters` : `${file.sizeMB || "-"} MB`}
            </p>
          </div>
        </div>

        <div className="file-right">
          {file.type === 'text' ? (
            <>
              <button 
                className="btn view"
                onClick={() => {
                  navigator.clipboard.writeText(file.content);
                  alert('Text copied to clipboard!');
                }}
              >
                Copy Text
              </button>
              <button 
                className="btn view"
                onClick={() => {
                  const blob = new Blob([file.content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'shared-text.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn view" 
                onClick={() => {
                  if (file.url && file.url.startsWith('http')) {
                    window.open(file.url, '_blank', 'noopener,noreferrer');
                  } else {
                    alert('Invalid file URL');
                  }
                }}
                disabled={!file.url || !file.url.startsWith('http')}
              >
                View
              </button>
              <button 
                className="btn download" 
                onClick={() => {
                  if (file.url && file.url.startsWith('http')) {
                    fetch(file.url)
                      .then(res => res.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = file.filename || 'download';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      })
                      .catch(() => window.open(file.url, '_blank'));
                  } else {
                    alert('Invalid file URL');
                  }
                }}
                disabled={!file.url || !file.url.startsWith('http')}
              >
                Download
              </button>
            </>
          )}

          <div className="ellipsis-wrap" ref={menuRef}>
            <button className="ellipsis-btn" onClick={() => setOpen((s) => !s)} aria-label="Open menu">
              <MoreVertical size={18} />
            </button>
            {open && (
              <div className="ellipsis-menu">
                {showStar && (
                  <button className="menu-item" onClick={() => toggleStar(file)}>
                    {isStarred ? "Unstar" : "Star"}
                  </button>
                )}
                <button className="menu-item">Rename</button>
                <button className="menu-item" onClick={() => onDelete && onDelete(file)}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const Sidebar = () => (
    <div className="sidebar">
      <div className="sidebar-content">
        <h3>Quick Actions</h3>
        <button className="sidebar-btn" onClick={() => setIsUploadOpen(true)}>
          <Upload size={20} /> Upload Files
        </button>
        <button className="sidebar-btn" onClick={() => setIsRetrieveOpen(true)}>
          <Download size={20} /> Retrieve Files
        </button>
      </div>
    </div>
  );

  const TopNav = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    return (
      <nav className="top-nav">
        <div className="nav-content">
          <div className="nav-left">
            <h1 className="brand">EcoSystem</h1>
            <div className="nav-links">
              <button 
                className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => setCurrentView('home')}
              >
                <Home size={18} />
                <span>Home</span>
              </button>
              <button 
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                <File size={18} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
          
          <div className="nav-right">
            <div className="user-info">
              <User size={18} />
              <span>{user.email || 'User'}</span>
            </div>
            
            <button className="nav-btn">
              <Settings size={18} />
            </button>
            
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
            
            <button 
              className="menu-toggle"
              onClick={() => setShowLeftPanel(!showLeftPanel)}
            >
              ☰
            </button>
          </div>
        </div>
      </nav>
    );
  };

  const UploadModal = () => (
    <div className="modal" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
      <div className="modal-content upload-modal">
        <h2 className="upload-title">Upload Files</h2>

        <div className={`dropzone ${isDragActive ? 'drag-active' : ''}`} onClick={() => document.getElementById('file-input-hidden')?.click()}>
          <input
            id="file-input-hidden"
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.rtf,.csv,.xlsx,.xls,.ppt,.pptx,.zip,.rar,.7z,.tar,.gz"
            onChange={(e) => {
              console.log("Files selected:", e.target.files);
              onFilesChosen(e.target.files);
            }}
            style={{ display: 'none' }}
          />
          <div className="dropzone-inner">
            <div className="drop-emoji">📤</div>
            <div className="drop-text">
              <b>Drag & drop</b> files here or <span className="linkish">browse</span>
            </div>
            <div className="drop-subtext">Photos, Videos, Documents, Text files up to 3GB each</div>
          </div>
        </div>

        {uploadFiles.length > 0 && (
          <div className="selected-files">
            {uploadFiles.map((f, i) => (
              <div className="selected-file" key={`${f.name}-${i}`}>
                <div className="file-icon">{getFileIcon(f.name)}</div>
                <div className="file-col">
                  <div className="file-name-strong">{f.name}</div>
                  <div className="file-size-dim">{(f.size / (1024*1024)).toFixed(2)} MB</div>
                </div>
                <button className="remove-file" onClick={() => setUploadFiles((arr) => arr.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {isUploading && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="progress-label">Uploading... {uploadProgress}%</div>
          </div>
        )}

        {generatedCode && !isUploading && (
          <div className="code-wrap">
            <div className="code-title">Access Code</div>
            <div className="code-box">
              <span className="code-text">{generatedCode}</span>
              <button
                className="copy-btn"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(generatedCode); } catch {}
                }}
              >Copy</button>
            </div>
            
            <div className="qr-code-section">
              <div className="qr-title">QR Code</div>
              <div className="qr-code-container">
                {qrCodeImage ? (
                  <img src={qrCodeImage} alt="QR Code" className="qr-code-image" />
                ) : (
                  <div className="qr-loading">Generating QR code...</div>
                )}
                <p className="qr-instruction">Scan this QR code to retrieve files</p>
              </div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          {!generatedCode ? (
            <>
              <button onClick={handleUpload} disabled={isUploading || uploadFiles.length === 0}>{isUploading ? 'Uploading...' : 'Upload'}</button>
              <button className="cancel" onClick={() => { 
                setIsUploadOpen(false); 
                setUploadFiles([]); 
                setUploadProgress(0); 
              }}>Cancel</button>
            </>
          ) : (
            <button className="cancel" onClick={() => { 
              setIsUploadOpen(false); 
              setUploadFiles([]); 
              setUploadProgress(0);
              setGeneratedCode("");
              setQrCodeImage("");
              localStorage.removeItem('generatedCode');
              localStorage.removeItem('qrCodeImage');
            }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );

  const QRScanModal = () => (
    <div className="modal">
      <div className="modal-content qr-scan-modal">
        <div className="modal-header">
          <h3>Scan QR Code</h3>
        </div>
        <div className="modal-body">
          <div className="qr-scanner-container">
            {!scannerEnabled ? (
              <div className="camera-placeholder">
                <div className="camera-icon">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <p>Camera access required to scan QR codes</p>
                <button 
                  className="enable-camera-btn" 
                  onClick={async () => {
                    try {
                      setScannerEnabled(true);
                      setScanError('');
                      
                      // Initialize ZXing code reader
                      codeReader.current = new BrowserMultiFormatReader();
                      
                      // Start scanning
                      const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoRef.current);
                      
                      if (result) {
                        const scannedCode = result.getText().toUpperCase();
                        setQrCodeData(scannedCode);
                        setRetrieveCode(scannedCode);
                        setScannerEnabled(false);
                        codeReader.current.reset();
                        setIsQRScanOpen(false);
                        setIsRetrieveOpen(true);
                      }
                    } catch (error) {
                      console.error('Camera error:', error);
                      setScanError('Camera access denied or QR code not found');
                      setScannerEnabled(false);
                    }
                  }}
                >
                  Enable Camera
                </button>
              </div>
            ) : (
              <div className="qr-scanner">
                <video 
                  ref={videoRef}
                  style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }}
                  autoPlay
                  playsInline
                />
                <button 
                  className="stop-camera-btn"
                  onClick={() => {
                    if (codeReader.current) {
                      codeReader.current.reset();
                    }
                    setScannerEnabled(false);
                  }}
                >
                  Stop Camera
                </button>
              </div>
            )}
            
            {scanError && <div className="scan-error">{scanError}</div>}
            
            <div className="manual-input-section">
              <p className="or-text">Or enter code manually:</p>
              <input 
                className="manual-code-input"
                type="text" 
                placeholder="Enter 6-character code"
                value={qrCodeData}
                onChange={(e) => setQrCodeData(e.target.value.toUpperCase())}
                maxLength="6"
              />
            </div>
          </div>
          {retrieveError && <div className="error">{retrieveError}</div>}
        </div>
        <div className="modal-actions">
          <button 
            className="retrieve-btn" 
            onClick={() => {
              setRetrieveCode(qrCodeData);
              setIsQRScanOpen(false);
              setIsRetrieveOpen(true);
            }} 
            disabled={!qrCodeData || qrCodeData.length !== 6}
          >
            Use This Code
          </button>
          <button className="cancel" onClick={() => { setIsQRScanOpen(false); setQrCodeData(''); setRetrieveError(''); }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const TextUploadModal = React.memo(() => {
    const handleTextChange = React.useCallback((e) => {
      setTextContent(e.target.value);
    }, []);

    return (
      <div className="modal">
        <div className="modal-content text-upload-modal">
          <div className="modal-header">
            <h3>Share Text Content</h3>
          </div>
          <div className="modal-body">
            <label className="label" htmlFor="text-content">Enter or paste your text:</label>
            <textarea
              id="text-content"
              className="text-content-input"
              placeholder="Paste your text, notes, links, or any content here..."
              value={textContent}
              onChange={handleTextChange}
              rows={8}
              autoComplete="off"
              spellCheck="false"
            />
            <div className="text-info">
              {textContent.length} characters
            </div>
          </div>
          <div className="modal-actions">
            <button 
              className="upload-btn" 
              onClick={handleTextUpload} 
              disabled={!textContent.trim() || isUploading}
            >
              {isUploading ? 'Sharing...' : 'Share Text'}
            </button>
            <button 
              className="cancel" 
              onClick={() => { 
                setIsTextUploadOpen(false); 
                setTextContent(''); 
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  });

  const RetrieveModal = () => {
    const inputRef = useRef(null);

    const handleRetrieveClick = async () => {
      const code = inputRef.current?.value || "";
      if (!code) return alert("Please enter an access code!");
      
      setRetrieveCode(code);
      
      try {
        setRetrieveLoading(true);
        setRetrieveError("");
        const filesFound = await getFilesByCode(code);
        
        const fileArray = Array.isArray(filesFound) ? filesFound : [];
        
        const newRecent = fileArray.map((f) => {
          const fileUrl = f?.url || f?.secure_url || null;
          console.log('Retrieved file URL:', fileUrl, 'for file:', f?.filename);
          return {
            ...f,
            code: code,
            filename: f?.filename || f?.public_id || 'Unknown file',
            url: fileUrl,
            content: f?.content || null,
            type: f?.type || f?.resource_type || 'file',
            size: f?.size || f?.bytes || 0,
            sizeMB: f?.size ? (f.size / (1024 * 1024)).toFixed(2) : (f?.bytes ? (f.bytes / (1024 * 1024)).toFixed(2) : '0')
          };
        });
        
        setRetrievedFiles(newRecent);
        
        setRecentFiles((r) => {
          const combined = [...newRecent, ...r];
          const seen = new Set();
          return combined.filter((it) => {
            if (!it.url && !it.content) return false;
            const key = it.url || it.content || it.filename;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      } catch (err) {
        setRetrieveError(err.message || "No content found for this code.");
      } finally {
        setRetrieveLoading(false);
      }
    };

    return (
      <div className="modal">
        <div className="modal-content retrieve-modal">
          <div className="modal-header"><h3>Retrieve Content</h3></div>
          <div className="modal-body">
            <label className="label" htmlFor="retrieve-input">Enter access code</label>
            <input 
              ref={inputRef}
              id="retrieve-input"
              className="retrieve-input"
              type="text" 
              placeholder="e.g. 7BL29Y"
              defaultValue={retrieveCode}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase().slice(0, 6);
              }}
              maxLength="6"
              autoComplete="off"
            />
            {retrieveError && <div className="error">{retrieveError}</div>}
            
            {retrievedFiles.length > 0 && (
              <div className="retrieved-files">
                <h4>Retrieved Files ({retrievedFiles.length})</h4>
                {retrievedFiles.map((file, i) => (
                  <div key={i} className="retrieved-file">
                    <div className="file-info">
                      <span className="file-icon">{file.type === 'text' ? '📝' : getFileIcon(file.filename || '')}</span>
                      <div className="file-details">
                        <div className="file-name">{file.type === 'text' ? 'Shared Text' : file.filename}</div>
                        <div className="file-size">{file.type === 'text' ? `${file.content?.length || 0} chars` : `${(file.size / (1024*1024)).toFixed(2)} MB`}</div>
                      </div>
                    </div>
                    <div className="file-actions">
                      {file.type === 'text' ? (
                        <>
                          <button className="btn-small" onClick={() => {
                            navigator.clipboard.writeText(file.content);
                            alert('Text copied!');
                          }}>Copy</button>
                          <button className="btn-small" onClick={() => {
                            const blob = new Blob([file.content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'shared-text.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}>Download</button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn-small" 
                            onClick={() => {
                              if (file.url && file.url.startsWith('http')) {
                                window.open(file.url, '_blank', 'noopener,noreferrer');
                              } else {
                                alert('Invalid file URL');
                              }
                            }}
                            disabled={!file.url || !file.url.startsWith('http')}
                          >
                            View
                          </button>
                          <button 
                            className="btn-small" 
                            onClick={() => {
                              if (file.url && file.url.startsWith('http')) {
                                fetch(file.url)
                                  .then(res => res.blob())
                                  .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = file.filename || 'download';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                  })
                                  .catch(() => window.open(file.url, '_blank'));
                              } else {
                                alert('Invalid file URL');
                              }
                            }}
                            disabled={!file.url || !file.url.startsWith('http')}
                          >
                            Download
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-actions">
            {retrievedFiles.length === 0 ? (
              <button className="retrieve-btn" onClick={handleRetrieveClick} disabled={retrieveLoading}>
                {retrieveLoading ? 'Searching…' : 'Retrieve'}
              </button>
            ) : (
              <>
                <button className="retrieve-btn" onClick={async () => {
                  const validFiles = retrievedFiles.filter(f => f.url && f.url.startsWith('http'));
                  if (validFiles.length === 0) return alert('No valid files to download');
                  
                  for (const file of validFiles) {
                    await fetch(file.url)
                      .then(res => res.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = file.filename || 'download';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      })
                      .catch(err => console.error('Download failed:', err));
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }}>Download All</button>
                <button className="retrieve-btn" onClick={() => {
                  setRetrievedFiles([]);
                  setRetrieveError("");
                }}>Search Again</button>
              </>
            )}
            <button className="cancel" onClick={() => { 
              setIsRetrieveOpen(false); 
              setRetrieveError(""); 
              setRetrieveCode("");
              setRetrievedFiles([]);
            }}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  const UploadedBar = () => (
    <div className="uploaded-bar">
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Recently Uploaded</h4>
          {uploadedFiles.slice(0, 3).map((file, i) => (
            <div key={i} className="uploaded-item">
              <span>{file.filename}</span>
              <span>Code: {file.code}</span>
              <button onClick={() => handleRemoveUploaded(file)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <TopNav />
      
      <div className="dashboard">
        {showLeftPanel && <Sidebar />}

        <div className="dashboard-content">
          {currentView === 'home' ? (
            <HomePage onGetStarted={() => setCurrentView('dashboard')} />
          ) : (
            <>
              <motion.header 
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1>EcoSystem Dashboard</h1>
                <p>Upload, share, and manage your files securely</p>
              </motion.header>

              <div className="professional-layout">
            {/* Top Action Bar */}
            <div className="action-bar">
              <motion.button
                className="action-btn upload"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setGeneratedCode("");
                  setQrCodeImage("");
                  localStorage.removeItem('generatedCode');
                  localStorage.removeItem('qrCodeImage');
                  setIsUploadOpen(true);
                }}
              >
                <Upload size={18} />
                <span>Upload Files</span>
              </motion.button>


              
              <motion.button
                className="action-btn retrieve"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsRetrieveOpen(true)}
              >
                <Download size={18} />
                <span>Enter Code</span>
              </motion.button>
              
              <motion.button
                className="action-btn text-share"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsTextUploadOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span>Share Text</span>
              </motion.button>
            </div>

            {/* Main Grid Layout */}
            <div className="main-grid">
              {/* Left Column - File Sections */}
              <div className="files-column">
                {generatedCode && (
                  <motion.section
                    className="file-section generated-code-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="section-header">
                      <div style={{fontSize: '24px'}}>🔑</div>
                      <h3>Your Access Code</h3>
                    </div>
                    <div className="code-display">
                      <div className="code-box-large">
                        <span className="code-text-large">{generatedCode}</span>
                        <button
                          className="copy-btn-large"
                          onClick={async () => {
                            try { 
                              await navigator.clipboard.writeText(generatedCode);
                              alert('Code copied!');
                            } catch {}
                          }}
                        >Copy Code</button>
                      </div>
                      {qrCodeImage && (
                        <div className="qr-display">
                          <img src={qrCodeImage} alt="QR Code" className="qr-code-dashboard" />
                          <p>Share this code or QR to access files</p>
                        </div>
                      )}
                      <button 
                        className="clear-code-btn"
                        onClick={() => {
                          setGeneratedCode("");
                          setQrCodeImage("");
                          localStorage.removeItem('generatedCode');
                          localStorage.removeItem('qrCodeImage');
                        }}
                      >
                        Clear Code
                      </button>
                    </div>
                  </motion.section>
                )}

                <motion.section
                  className="file-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="section-header">
                    <Clock size={20} />
                    <h3>Recent Uploads</h3>
                  </div>
                  <div className="file-list">
                    <AnimatePresence>
                      {uploadedFiles?.length ? (
                        uploadedFiles.map((file, i) => (
                          <FileCard 
                            key={file.url || i} 
                            file={file} 
                            onDelete={handleRemoveUploaded}
                            showStar={false}
                          />
                        ))
                      ) : (
                        <p className="empty-state">No uploads yet</p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.section>
              </div>

              {/* Right Column - Storage & Info */}
              <div className="info-column">
                <StorageBlock />
                <UploadedBar />
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {isUploadOpen && <UploadModal />}
      {isRetrieveOpen && <RetrieveModal />}
      {isTextUploadOpen && <TextUploadModal />}
    </div>
  );
};

export default MainApp;
