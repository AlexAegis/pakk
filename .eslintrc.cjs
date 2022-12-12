module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended',
		'plugin:unicorn/recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['node_modules', 'dist', 'coverage', '.turbo', 'tmp'],
	overrides: [],
	settings: {
		next: {
			rootDir: ['apps/*/'],
		},
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
	env: {
		browser: true,
		es2020: true,
		node: true,
	},
	rules: {
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		quotes: ['error', 'single', { avoidEscape: true }],
		'unicorn/no-array-reduce': 'off',
		'unicorn/prevent-abbreviations': 'off', // no thanks
		'unicorn/prefer-ternary': 'off', // no thanks
		'unicorn/prefer-top-level-await': 'off', // Until ES2022 is used as target
		'unicorn/no-useless-undefined': 'off', // for .catch(() => undefined)
	},
};
