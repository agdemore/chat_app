var webpack = require('webpack');

module.exports = {
  context: __dirname +  '/js',
  target: 'electron',
  entry: './entry.js',

  output: {
    filename: 'bundle.js',
    path: __dirname + '/build'
  },

  module: {
    loaders: [
        {
            test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/,
            query:
            {
                presets: ['es2015', 'react']
            }
        }
    ]
  }
};
