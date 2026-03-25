import { redirect } from '@sveltejs/kit';
import { loadAdminSession } from '$lib/studio/api';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, url }) => {
	const isLoginPage = url.pathname === '/studio/login';
	let sessionError = '';

	const session = await loadAdminSession(fetch).catch((error) => {
		if (isLoginPage) {
			sessionError = error instanceof Error ? error.message : '后台服务暂时不可用';
			return {
				authenticated: false,
				username: ''
			};
		}
		throw error;
	});

	if (!session.authenticated && !isLoginPage) {
		throw redirect(302, '/studio/login');
	}

	if (session.authenticated && isLoginPage) {
		throw redirect(302, '/studio');
	}

	return {
		session,
		sessionError
	};
};
