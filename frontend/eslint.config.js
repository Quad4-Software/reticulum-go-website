import svelte from 'eslint-plugin-svelte';
import securityPlugin from 'eslint-plugin-security';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		plugins: {
			security: securityPlugin
		},
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/no-at-html-tags': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],
			...securityPlugin.configs.recommended.rules,
			'security/detect-object-injection': 'off'
		}
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'cmd/', 'static/wasm_exec.js', 'coverage/']
	}
);
