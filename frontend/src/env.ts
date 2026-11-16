import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_SHOW_COOLIFY: {
		public: true,
		schema: (value) => value === 'true',
		description: 'Show the Coolify badge in the footer'
	}
});
