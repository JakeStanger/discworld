module.exports = {
  entry: "./client/index.ts",
  devtool: "source-map",
  mode: "development",
  output: {
    filename: "bundle.js",
    path: __dirname + "/public/js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {test: /\.tsx?$/, loader: "ts-loader"}
    ]
  }
};
