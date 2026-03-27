import { Button, Card, Chip, Spinner, cn } from '@heroui/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
	Link,
	NavLink,
	Navigate,
	Outlet,
	useLocation,
	useNavigate,
	useOutletContext
} from 'react-router-dom';
import { loadAdminSession, logoutAdmin } from '../lib/api/studio';
import type { AdminSessionResponse } from '../lib/types/studio';

const publicLinks = [
	{ to: '/', label: '首页' },
	{ to: '/explore', label: '全部片段' }
];

const studioLinks = [
	{ to: '/studio', label: '总览' },
	{ to: '/studio/snippets', label: '内容管理' },
	{ to: '/studio/snippets/new', label: '新建内容' }
];

export function PublicLayout() {
	return (
		<div className="min-h-screen">
			<a
				className="sr-only absolute left-4 top-4 z-50 rounded-full bg-[var(--app-accent)] px-4 py-2 text-sm text-white focus:not-sr-only"
				href="#main-content"
			>
				跳到正文
			</a>
			<header className="page-shell">
				<div className="surface-panel surface-panel-strong flex flex-wrap items-center justify-between gap-4 rounded-[var(--app-radius-xl)] px-5 py-4">
					<Link className="flex items-center gap-3" to="/">
						<div className="grid size-11 place-items-center rounded-full bg-[var(--app-accent)] text-white">
							SS
						</div>
						<div>
							<p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-accent)]">
								SwiftSnippet
							</p>
							<p className="m-0 text-sm text-[var(--app-muted)]">
								几秒内找到值得带走的 SwiftUI 片段
							</p>
						</div>
					</Link>

					<nav className="flex flex-wrap items-center gap-2">
						{publicLinks.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive }) =>
									cn(
										'rounded-full px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f0e9]',
										isActive
											? 'bg-[var(--app-accent)] text-white'
											: 'bg-white/60 text-[var(--app-muted)] hover:bg-white'
									)
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
				</div>
			</header>
			<Outlet />
		</div>
	);
}

type StudioContextValue = {
	session: AdminSessionResponse;
	refreshSession: () => Promise<void>;
};

export function StudioGuard() {
	const navigate = useNavigate();
	const location = useLocation();
	const [session, setSession] = useState<AdminSessionResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	const refreshSession = async () => {
		try {
			setError(null);
			const result = await loadAdminSession();
			setSession(result);
		} catch (fetchError) {
			setError(fetchError instanceof Error ? fetchError.message : '无法获取后台会话');
		}
	};

	useEffect(() => {
		void refreshSession();
	}, []);

	if (error) {
		return (
			<main className="page-shell">
				<Card className="surface-panel rounded-[var(--app-radius-xl)]">
					<Card.Content className="p-8">
						<p className="eyebrow">后台状态</p>
						<h1 className="display-title mt-3 text-3xl">后台暂时无法连接</h1>
						<p className="subtle-text mt-3">{error}</p>
					</Card.Content>
				</Card>
			</main>
		);
	}

	if (!session) {
		return (
			<main className="grid min-h-screen place-items-center">
				<div className="surface-panel flex items-center gap-3 rounded-full px-5 py-3">
					<Spinner size="sm" />
					<span className="text-sm text-[var(--app-muted)]">正在唤起 Studio 会话…</span>
				</div>
			</main>
		);
	}

	if (!session.authenticated) {
		return <Navigate replace state={{ from: location.pathname }} to="/studio/login" />;
	}

	return (
		<div className="page-shell">
			<div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
				<aside className="surface-panel surface-panel-strong rounded-[var(--app-radius-xl)] p-4">
					<div className="mb-5 flex items-center gap-3">
						<div className="grid size-10 place-items-center rounded-full bg-[var(--app-accent)] text-sm font-semibold text-white">
							{(session.username || 'admin').slice(0, 2).toUpperCase()}
						</div>
						<div>
							<p className="m-0 text-sm font-semibold">Studio</p>
							<p className="m-0 text-xs text-[var(--app-muted)]">
								{session.username || 'admin'}
							</p>
						</div>
					</div>

					<nav className="grid gap-2">
						{studioLinks.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive }) =>
									cn(
										'rounded-[16px] px-4 py-3 text-sm transition',
										isActive
											? 'bg-[var(--app-accent)] text-white'
											: 'bg-white/55 text-[var(--app-muted)] hover:bg-white'
									)
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>

					<div className="mt-5 rounded-[18px] bg-[var(--app-accent-soft)] p-4">
						<p className="eyebrow">当前状态</p>
						<p className="mb-0 mt-2 text-sm leading-7 text-[var(--app-muted)]">
							这套后台现在只服务内容录入、校验和发布，不再夹带旧视觉包袱。
						</p>
					</div>

					<Button
						className="mt-5 w-full"
						onPress={async () => {
							await logoutAdmin();
							navigate('/studio/login', { replace: true });
						}}
					>
						退出登录
					</Button>
				</aside>

				<div className="page-grid">
					<Outlet context={{ session, refreshSession } satisfies StudioContextValue} />
				</div>
			</div>
		</div>
	);
}

export function useStudioSession() {
	return useOutletContext<StudioContextValue>();
}

export function SectionHeader(props: {
	eyebrow: string;
	title: string;
	description: string;
	aside?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4">
			<div className="max-w-2xl">
				<p className="eyebrow">{props.eyebrow}</p>
				<h1 className="display-title mt-3 text-4xl leading-none">{props.title}</h1>
				<p className="subtle-text mt-3">{props.description}</p>
			</div>
			{props.aside ? <div>{props.aside}</div> : null}
		</div>
	);
}

export function MetaChip(props: { children: ReactNode }) {
	return (
		<Chip className="border border-black/8 bg-white/78 px-3 py-1 text-[12px] text-[var(--app-muted)]">
			{props.children}
		</Chip>
	);
}
