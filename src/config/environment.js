// Environment configuration for cross-platform compatibility
const config = {
  development: {
    serverUrl: 'http://localhost:4000',
    cloudinaryCloudName: 'dugyjycjw',
    cloudinaryUploadPreset: 'react_secure_share'
  },
  production: {
    serverUrl: window.location.origin, // Use same domain as frontend
    cloudinaryCloudName: 'dugyjycjw',
    cloudinaryUploadPreset: 'react_secure_share'
  }
};

const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env] || config.development;
};

export default getConfig;
