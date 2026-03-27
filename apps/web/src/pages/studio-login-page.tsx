import { Button, Card } from '@heroui/react';
import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../lib/api/studio';

export function StudioLoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			setLoading(true);
			setError(null);
			await loginAdmin(password);
			const from = (location.state as { from?: string } | null)?.from ?? '/studio';
			navigate(from, { replace: true });
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : '登录失败');
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="page-shell grid min-h-screen place-items-center">
			<Card className="surface-panel surface-panel-strong w-full max-w-xl rounded-[36px]">
				<Card.Content className="grid gap-6 p-8">
					<div>
						<p className="eyebrow">后台入口</p>
						<h1 className="display-title mt-3 text-5xl">进入内容运营台</h1>
						<p className="subtle-text mt-4">
							登录后直接回到内容录入、校验和发布链路，不需要再在旧后台里兜圈。
						</p>
					</div>

					<form className="grid gap-4" onSubmit={handleSubmit}>
						<div>
							<label className="mb-2 block text-sm font-medium" htmlFor="studio-password">
								管理员密码
							</label>
							<input
								aria-label="管理员密码"
								autoComplete="current-password"
								className="native-field"
								id="studio-password"
								name="password"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</div>
						{error ? (
							<p aria-live="polite" className="m-0 text-sm text-[var(--app-danger)]" role="alert">
								{error}
							</p>
						) : null}
						<Button className="bg-[var(--app-accent)] text-white" isDisabled={loading} type="submit">
							{loading ? '进入中…' : '进入 Studio'}
						</Button>
					</form>
				</Card.Content>
			</Card>
		</main>
	);
}
