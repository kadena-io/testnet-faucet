'use strict'

const { resolve } = require('path')

module.exports = {
  entry: ['babel-polyfill', './app/main'],
  output: {
    path: __dirname,
    filename: './public/bundle.js'
  },
  mode: 'development',
  context: __dirname,
  devtool: 'source-map',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /jsx?$/,
        include: resolve(__dirname, './app'),
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: 'url-loader?name=/media/[name].[hash:8].[ext]',
        options: {
          limit: 10000,
          name: '/public/media/[name].[hash:8].[ext]',
        }
      },
      {
        test: [/\.eot$/, /\.ttf$/, /\.svg$/, /\.woff$/, /\.woff2$/],
        loader: 'url-loader?name=/fonts/[name].[hash:8].[ext]',
        options: {
            name: '/public/fonts/[name].[hash:8].[ext]',
        }
      }
    ]
  }
}
