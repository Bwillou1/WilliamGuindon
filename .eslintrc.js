module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 13,
    "sourceType": "module"
  },
  "ignorePatterns": ["assets/vendor/**/*", "node_modules/**/*", "pagefind/**/*", "cosmic-space-background/**/*", "assets/js/papaparse.min.js", "assets/js/nostr-bundle.js"],
  "rules": {
    "no-empty": "off",
    "no-unused-vars": "off",
    "no-redeclare": "off",
    "no-useless-escape": "off",
    "no-undef": "off",
    "no-prototype-builtins": "off",
    "no-control-regex": "off",
    "no-sparse-arrays": "off",
    "no-inner-declarations": "off"
  }
};
