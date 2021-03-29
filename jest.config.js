module.exports = {
  transform: {
    "\\.(js|ts)$": [
      "babel-jest",
      {
        presets: ["@babel/preset-env", "@babel/preset-typescript"],
        plugins: [
          "@babel/plugin-transform-runtime",
          "@babel/plugin-proposal-class-properties"
        ]
      }
    ]
  },
  collectCoverage: true,
  collectCoverageFrom: ["src/**", "!templates/**"]
};
