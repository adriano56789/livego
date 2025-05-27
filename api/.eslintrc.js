module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'always',
      },
    ],
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_id'],
      },
    ],
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'class-methods-use-this': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
};
