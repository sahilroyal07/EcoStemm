// Environment configuration for cross-platform compatibility - Cache bust v2
const config = {
  development: {
    serverUrl: 'http://localhost:5002',
    cloudinaryCloudName: 'dzngaquws',
    cloudinaryUploadPreset: 'ml_default'
  },
  production: {
    serverUrl: 'https://ecosystem-file-share-3.onrender.com',
    cloudinaryCloudName: 'dzngaquws',
    cloudinaryUploadPreset: 'ml_default'
  }
};

const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env] || config.development;
};

export default getConfig;
