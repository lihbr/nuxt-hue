module.exports = {
  parserPreset: "conventional-changelog-conventionalcommits",
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["cli", "module", "release", "config", "deps", "misc"]
    ],
    "scope-empty": [2, "never"]
  }
};
