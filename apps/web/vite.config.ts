import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiBaseURL = env.API_BASE_URL || 'http://127.0.0.1:18080';

	return {
		plugins: [sveltekit()],
		server: {
			proxy: {
				'/api': {
					target: apiBaseURL,
					changeOrigin: true
				}
			}
		}
	};
});
