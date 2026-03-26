import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout, StudioGuard } from './components/layout';
import { ExplorePage } from './pages/explore-page';
import { HomePage } from './pages/home-page';
import { SnippetDetailPage } from './pages/snippet-detail-page';
import { StudioDashboardPage } from './pages/studio-dashboard-page';
import { StudioEditorPage } from './pages/studio-editor-page';
import { StudioLoginPage } from './pages/studio-login-page';
import { StudioSnippetsPage } from './pages/studio-snippets-page';

function HealthPage() {
	return (
		<main className="grid min-h-screen place-items-center bg-[var(--app-bg)] text-[var(--app-ink)]">
			<div className="rounded-full border border-black/10 bg-white/70 px-5 py-2 text-sm">
				ok
			</div>
		</main>
	);
}

export default function App() {
	return (
		<Routes>
			<Route path="/health" element={<HealthPage />} />
			<Route element={<PublicLayout />}>
				<Route index element={<HomePage />} />
				<Route path="/explore" element={<ExplorePage />} />
				<Route path="/snippets/:id" element={<SnippetDetailPage />} />
			</Route>
			<Route path="/studio/login" element={<StudioLoginPage />} />
			<Route path="/studio" element={<StudioGuard />}>
				<Route index element={<StudioDashboardPage />} />
				<Route path="snippets" element={<StudioSnippetsPage />} />
				<Route path="snippets/:id" element={<StudioEditorPage />} />
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
