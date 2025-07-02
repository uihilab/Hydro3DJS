const path = require('path');

module.exports = {
  mode: 'development',

  entry: {
    main_demo: './core/demo.js',
  },

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/', // serve from root
    clean: true,
  },

  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@core': path.resolve(__dirname, 'core'),
      '@ui': path.resolve(__dirname, 'ui'),
      '@models': path.resolve(__dirname, 'models'),
      '@geojsons': path.resolve(__dirname, 'geojsons'),
      '@maps': path.resolve(__dirname, 'maps'),
    },
  },

  devServer: {
    static: {
      directory: path.resolve(__dirname), // serve whole src folder
    },
    compress: true,
    port: 9000,
    open: true,
  },

  experiments: {
    topLevelAwait: true,
  },
};
