const path = require('path');

module.exports = {
  entry: './src/main.js',
  mode: 'development',
  output: {
    filename: 'dist/custom-sonos-card.js',
    path: path.resolve(__dirname),
    libraryTarget: 'umd',
  },
  optimization: {
    minimize: true,
  },
};
