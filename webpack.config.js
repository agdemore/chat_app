'use strict';


var webpack = require('webpack');

const path = require('path');

module.exports = {
  context: path.resolve(__dirname) +  '/js',
  target: 'electron',
  entry: './entry.js',

  output: {
    filename: 'bundle.js',
    path: __dirname + '/build'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
        {
            test: /\.js$/,
            loader: ['babel-loader'],
            exclude: /node_modules/,
            query:
            {
                presets: ['es2015', "stage-0", 'react']
            }
        },
        {
            test: /\.jsx$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/,
            query:
            {
                presets: ['es2015', "stage-0", 'react']
            }
        },
        {
            test: /\.json$/,
            loader: "json-loader"
        }
    ]
  }
};
