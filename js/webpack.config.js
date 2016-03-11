'use strict';

const path = require('path');

let config = {
  context: path.resolve(__dirname),
  target: 'electron',
  entry: './index',
  output: {
    path: __dirname,
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.css', '.png']
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        // query: {
        //   optional: ['runtime'],
        //   stage: 0
        // },
        exclude: /node_modules/,
        query:
        {
            presets:["es2015", "stage-0", "react"]
        }
      },
      {
        test: /\.css$/,
        loader: 'style!css'
      },
      {
        test: /.png$/,
        loader: 'file'
      }
    ]
  }
};

module.exports = config;
