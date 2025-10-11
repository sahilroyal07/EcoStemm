// Environment configuration for cross-platform compatibility
const config = {
  development: {
    serverUrl: 'http://localhost:5002',
    cloudinaryCloudName: 'dzngaquws',
    cloudinaryUploadPreset: 'ml_default'
  },
  production: {
    serverUrl: 'https://your-render-app-name.onrender.com', // Replace with your Render URL
    cloudinaryCloudName: 'dzngaquws',
    cloudinaryUploadPreset: 'ml_default'
  }
};

const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env] || config.development;
};

export default getConfig;
