import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	expect: {
		timeout: 5_000
	},
	use: {
		baseURL: 'http://127.0.0.1:13001',
		trace: 'on-first-retry'
	},
	webServer: {
		command:
			'PID_FILE=.swiftsnippet.e2e.pids API_PORT=18081 API_ADDRESS=:18081 WEB_PORT=13001 API_BASE_URL=http://127.0.0.1:18081 ADMIN_PASSWORD=development-admin-password ADMIN_SESSION_SECRET=development-admin-session-secret bash scripts/dev.sh',
		cwd: rootDir,
		url: 'http://127.0.0.1:13001',
		timeout: 180_000,
		reuseExistingServer: false
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
