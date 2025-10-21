const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
  };

  config.resolve.alias = {
    ...config.resolve.alias,
    process: "process/browser.js",
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser.js",
    }),
  ]);

  return config;
};