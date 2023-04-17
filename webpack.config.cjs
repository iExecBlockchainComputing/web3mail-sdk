const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      assert: require.resolve('assert/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'), // required for crypto-browserify
      constants: require.resolve('constants-browserify'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '');
      switch (mod) {
        case 'buffer':
          resource.request = 'buffer';
          break;
        case 'stream':
          resource.request = 'readable-stream';
          break;
        default:
          throw new Error(`Not found ${mod}`);
      }
    }),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'iexec-data-protector',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
};
