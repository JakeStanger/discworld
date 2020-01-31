module.exports = {
  entry: "./src/index.ts",
  devtool: "source-map",
  mode: "development",
  output: {
    filename: "bundle.js",
    path: __dirname + "/../server/public/js"
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
