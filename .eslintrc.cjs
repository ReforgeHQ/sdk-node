module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["standard-with-typescript", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.eslint.json"],
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/method-signature-style": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "promise/param-names": "off",
  },
};
