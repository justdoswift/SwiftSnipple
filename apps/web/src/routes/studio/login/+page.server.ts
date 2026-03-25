import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const adminSessionCookieName = 'swiftsnippet_admin_session';

function apiBaseURL() {
	return env.API_BASE_URL || 'http://127.0.0.1:18080';
}

function extractCookieValue(setCookieHeader: string | null) {
	if (!setCookieHeader) {
		return '';
	}

	const match = setCookieHeader.match(
		new RegExp(`${adminSessionCookieName}=([^;]+)`, 'i')
	);

	return match?.[1] ?? '';
}

export const actions: Actions = {
	default: async ({ request, cookies, url, fetch }) => {
		const formData = await request.formData();
		const password = String(formData.get('password') ?? '').trim();

		if (!password) {
			return fail(400, {
				errorMessage: '请输入管理员密码'
			});
		}

		const response = await fetch(`${apiBaseURL()}/api/v1/admin/session`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({ password })
		});

		if (!response.ok) {
			let errorMessage = '登录失败';
			try {
				const payload = (await response.json()) as { message?: string };
				if (payload.message) {
					errorMessage = payload.message;
				}
			} catch {
				// Ignore JSON parsing failures and fall back to the generic message.
			}

			return fail(response.status, {
				errorMessage
			});
		}

		const sessionCookieValue = extractCookieValue(response.headers.get('set-cookie'));
		if (!sessionCookieValue) {
			return fail(500, {
				errorMessage: '后台会话创建失败，请重试'
			});
		}

		cookies.set(adminSessionCookieName, sessionCookieValue, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 12
		});

		throw redirect(303, '/studio');
	}
};
