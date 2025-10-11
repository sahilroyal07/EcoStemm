import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Shield, Zap, Cloud, Users } from 'lucide-react';

const HomePage = ({ onGetStarted }) => {
  const features = [
    {
      icon: <Upload size={32} />,
      title: "Secure File Upload",
      description: "Upload files up to 3GB with enterprise-grade security and encryption."
    },
    {
      icon: <Download size={32} />,
      title: "Cross-Device Access",
      description: "Upload on Mac, access on mobile. Use the same code to retrieve files on any device, anywhere."
    },
    {
      icon: <Shield size={32} />,
      title: "Privacy Protected",
      description: "Your files are stored securely with Cloudinary's robust infrastructure and privacy controls."
    },
    {
      icon: <Zap size={32} />,
      title: "Lightning Fast",
      description: "Powered by Cloudinary's global CDN for ultra-fast uploads and downloads worldwide."
    },
    {
      icon: <Cloud size={32} />,
      title: "Cloud Storage",
      description: "Reliable cloud storage with real-time usage tracking and automatic backups."
    },
    {
      icon: <Users size={32} />,
      title: "Universal Compatibility",
      description: "Works on Mac, Windows, iOS, Android, and any device with a web browser. True cross-platform access."
    }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <motion.section 
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <h1>EcoSystem - Cross-Device File Access</h1>
          <p>Upload files from any device and access them anywhere. Share files seamlessly between your Mac, mobile, and any computer with just a simple code.</p>
          
          <div className="hero-actions">
            <motion.button 
              className="cta-button primary"
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free
            </motion.button>
            <motion.button 
              className="cta-button secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </div>
        </div>
        
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="device-demo">
            <div className="device mac">💻 Mac</div>
            <div className="upload-flow">
              <div className="demo-file">📄 Upload</div>
              <div className="demo-arrow">→</div>
              <div className="demo-code">ABC123</div>
            </div>
            <div className="device mobile">📱 Mobile</div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="features">
        <div className="features-header">
          <h2>Why Choose EcoSystem?</h2>
          <p>Professional file sharing with the security and reliability your business needs</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <motion.div 
            className="step"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="step-number">1</div>
            <h3>Upload from Any Device</h3>
            <p>Upload files from your Mac, PC, or mobile device</p>
          </motion.div>
          
          <motion.div 
            className="step"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="step-number">2</div>
            <h3>Get Access Code</h3>
            <p>Receive a unique 6-character code for your files</p>
          </motion.div>
          
          <motion.div 
            className="step"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="step-number">3</div>
            <h3>Access Anywhere</h3>
            <p>Use the code on any device to download your files</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="cta-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2>Ready to Start Sharing Securely?</h2>
        <p>Join thousands of users who trust EcoSystem for their file sharing needs</p>
        <motion.button 
          className="cta-button primary large"
          onClick={onGetStarted}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Sharing Now
        </motion.button>
      </motion.section>
    </div>
  );
};

export default HomePage;