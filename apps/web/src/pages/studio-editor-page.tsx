import { Button, Card, Spinner } from '@heroui/react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	createAdminSnippet,
	loadAdminSnippet,
	moveSnippetToReview,
	publishSnippetVersion,
	saveAdminSnippet,
	uploadAdminAsset,
	validateAdminSnippet
} from '../lib/api/studio';
import type {
	AdminCreateSnippetRequest,
	AdminEditableFile,
	AdminSnippetEditorPayload,
	AdminValidationResponse
} from '../lib/types/studio';
import { formatPlatforms, parsePlatforms, parseTags, stateLabel } from '../lib/utils/format';

function emptyDraft(): AdminSnippetEditorPayload {
	return {
		id: '',
		title: '',
		summary: '',
		categoryPrimary: 'layout',
		difficulty: 'easy',
		version: '1.0.0',
		state: 'draft',
		sourceRevision: '',
		tags: [],
		platforms: [{ os: 'ios', minVersion: '17.0' }],
		assets: { cover: 'Media/cover.png', demo: 'Media/demo.mp4' },
		license: {
			code: 'MIT',
			media: 'CC-BY-4.0',
			thirdPartyNotice: 'LICENSES/THIRD_PARTY.md',
			thirdPartyText: ''
		},
		codeFiles: [{ path: 'Sources/Snippet.swift', label: '主代码文件', content: '' }],
		promptFiles: [{ path: 'Prompts/default.md', label: '主 Prompt', kind: 'prompt', content: '' }]
	};
}

function FileEditor(props: {
	title: string;
	files: AdminEditableFile[];
	onChange: (next: AdminEditableFile[]) => void;
}) {
	return (
		<Card className="surface-panel rounded-[24px]">
			<Card.Content className="grid gap-4 p-5">
				<div className="flex items-center justify-between gap-3">
					<h3 className="display-title m-0 text-2xl">{props.title}</h3>
					<Button
						className="bg-white/75"
						onPress={() =>
							props.onChange([
								...props.files,
								{
									path: '',
									label: '新文件',
									content: ''
								}
							])
						}
					>
						新增文件
					</Button>
				</div>
				<div className="grid gap-4">
					{props.files.map((file, index) => (
						<div key={`${file.path}-${index}`} className="grid gap-3 rounded-[20px] bg-white/72 p-4">
							<div className="grid gap-3 lg:grid-cols-2">
								<input
									className="native-field"
									placeholder="文件路径"
									value={file.path}
									onChange={(event) => {
										const next = [...props.files];
										next[index] = { ...file, path: event.target.value };
										props.onChange(next);
									}}
								/>
								<input
									className="native-field"
									placeholder="显示名称"
									value={file.label}
									onChange={(event) => {
										const next = [...props.files];
										next[index] = { ...file, label: event.target.value };
										props.onChange(next);
									}}
								/>
							</div>
							<textarea
								className="native-textarea"
								placeholder="文件内容"
								value={file.content}
								onChange={(event) => {
									const next = [...props.files];
									next[index] = { ...file, content: event.target.value };
									props.onChange(next);
								}}
							/>
						</div>
					))}
				</div>
			</Card.Content>
		</Card>
	);
}

export function StudioEditorPage() {
	const navigate = useNavigate();
	const { id = 'new' } = useParams();
	const isNew = id === 'new';
	const [draft, setDraft] = useState<AdminSnippetEditorPayload>(emptyDraft());
	const [tagsText, setTagsText] = useState('ios, card');
	const [platformsText, setPlatformsText] = useState('ios:17.0');
	const [loading, setLoading] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [validation, setValidation] = useState<AdminValidationResponse | null>(null);

	useEffect(() => {
		if (isNew) {
			return;
		}

		let active = true;
		void (async () => {
			try {
				setLoading(true);
				setError(null);
				const payload = await loadAdminSnippet(id);
				if (active) {
					setDraft(payload);
					setTagsText(payload.tags.join(', '));
					setPlatformsText(formatPlatforms(payload.platforms));
				}
			} catch (fetchError) {
				if (active) {
					setError(fetchError instanceof Error ? fetchError.message : '加载编辑器失败');
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, [id, isNew]);

	const dirty = useMemo(
		() => JSON.stringify(draft.tags) !== JSON.stringify(parseTags(tagsText)) || formatPlatforms(draft.platforms) !== platformsText,
		[draft.platforms, draft.tags, platformsText, tagsText]
	);

	const updateDraft = <K extends keyof AdminSnippetEditorPayload>(
		key: K,
		value: AdminSnippetEditorPayload[K]
	) => {
		setDraft((current) => ({ ...current, [key]: value }));
	};

	const normalizedDraft = {
		...draft,
		tags: parseTags(tagsText),
		platforms: parsePlatforms(platformsText)
	};

	const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const payload: AdminCreateSnippetRequest = {
			id: draft.id,
			title: draft.title,
			summary: draft.summary,
			categoryPrimary: draft.categoryPrimary,
			difficulty: draft.difficulty,
			version: draft.version
		};

		try {
			setSaving(true);
			setError(null);
			const created = await createAdminSnippet(payload);
			navigate(`/studio/snippets/${created.id}`, { replace: true });
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : '新建失败');
		} finally {
			setSaving(false);
		}
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			setStatus(null);
			const saved = await saveAdminSnippet(draft.id, normalizedDraft);
			setDraft(saved);
			setTagsText(saved.tags.join(', '));
			setPlatformsText(formatPlatforms(saved.platforms));
			setStatus('已保存修改');
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : '保存失败');
		} finally {
			setSaving(false);
		}
	};

	const handleValidation = async () => {
		try {
			setValidation(await validateAdminSnippet(draft.id));
			setStatus('已刷新校验结果');
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : '校验失败');
		}
	};

	const handleAssetUpload = async (
		kind: 'cover' | 'demo',
		event: ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file || !draft.id || isNew) {
			return;
		}

		try {
			const response = await uploadAdminAsset(draft.id, kind, file);
			setDraft((current) => ({
				...current,
				assets: {
					...current.assets,
					[kind === 'cover' ? 'coverPreviewUrl' : 'demoPreviewUrl']: response.previewUrl
				}
			}));
			setStatus(`${kind === 'cover' ? '封面' : '演示'}已上传`);
		} catch (uploadError) {
			setError(uploadError instanceof Error ? uploadError.message : '上传失败');
		}
	};

	if (loading) {
		return (
			<div className="surface-panel flex items-center gap-3 rounded-full px-5 py-3">
				<Spinner size="sm" />
				<span className="text-sm text-[var(--app-muted)]">正在打开编辑器…</span>
			</div>
		);
	}

	return (
		<div className="page-grid pb-10">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="eyebrow">Studio / editor</p>
					<h1 className="display-title mt-3 text-4xl">{isNew ? '新建内容' : draft.title}</h1>
					<p className="subtle-text mt-3">
						{isNew
							? '先生成内容骨架，随后再补代码、Prompt、媒体和许可。'
							: `当前状态：${stateLabel(draft.state)}。这次编辑器优先强调可保存、可校验、可发布。`}
					</p>
				</div>
				{!isNew ? (
					<div className="flex flex-wrap gap-3">
						<Button className="bg-white/75" onPress={handleValidation}>
							运行校验
						</Button>
						<Button
							className="bg-white/75"
							onPress={async () => {
								await moveSnippetToReview(draft.id);
								setStatus('已移入待发布');
							}}
						>
							进入 Review
						</Button>
						<Button
							className="bg-[var(--app-accent)] text-white"
							onPress={async () => {
								const result = await publishSnippetVersion(draft.id, draft.version);
								setStatus(`已发布 ${result.publishedVersion}`);
							}}
						>
							直接发布
						</Button>
					</div>
				) : null}
			</div>

			{status ? (
				<div className="rounded-[18px] bg-[#eef7ef] px-5 py-4 text-sm text-[var(--app-success)]">
					{status}
				</div>
			) : null}
			{error ? (
				<div className="rounded-[18px] bg-[#fef0ed] px-5 py-4 text-sm text-[var(--app-danger)]">
					{error}
				</div>
			) : null}

			<form className="page-grid" onSubmit={isNew ? handleCreate : undefined}>
				<Card className="surface-panel rounded-[24px]">
					<Card.Content className="grid gap-4 p-5 lg:grid-cols-2">
						<div className="lg:col-span-2">
							<h2 className="display-title m-0 text-2xl">基础信息</h2>
						</div>
						<input
							aria-label="Snippet ID"
							className="native-field"
							placeholder="Snippet ID"
							value={draft.id}
							onChange={(event) => updateDraft('id', event.target.value)}
						/>
						<input
							aria-label="版本号"
							className="native-field"
							placeholder="版本号"
							value={draft.version}
							onChange={(event) => updateDraft('version', event.target.value)}
						/>
						<input
							aria-label="标题"
							className="native-field lg:col-span-2"
							placeholder="标题"
							value={draft.title}
							onChange={(event) => updateDraft('title', event.target.value)}
						/>
						<textarea
							aria-label="摘要"
							className="native-textarea lg:col-span-2"
							placeholder="摘要"
							value={draft.summary}
							onChange={(event) => updateDraft('summary', event.target.value)}
						/>
						<select
							aria-label="分类"
							className="native-select"
							value={draft.categoryPrimary}
							onChange={(event) => updateDraft('categoryPrimary', event.target.value)}
						>
							<option value="layout">layout</option>
							<option value="animation">animation</option>
							<option value="state">state</option>
							<option value="ai">ai</option>
							<option value="component">component</option>
							<option value="navigation">navigation</option>
						</select>
						<select
							aria-label="难度"
							className="native-select"
							value={draft.difficulty}
							onChange={(event) => updateDraft('difficulty', event.target.value)}
						>
							<option value="easy">easy</option>
							<option value="medium">medium</option>
							<option value="hard">hard</option>
						</select>
						<input
							aria-label="标签"
							className="native-field"
							placeholder="标签，逗号分隔"
							value={tagsText}
							onChange={(event) => setTagsText(event.target.value)}
						/>
						<textarea
							aria-label="平台"
							className="native-textarea"
							placeholder="平台，每行 os:minVersion"
							value={platformsText}
							onChange={(event) => setPlatformsText(event.target.value)}
						/>
					</Card.Content>
				</Card>

				<Card className="surface-panel rounded-[24px]">
					<Card.Content className="grid gap-4 p-5 lg:grid-cols-2">
						<div className="lg:col-span-2">
							<h2 className="display-title m-0 text-2xl">媒体与许可</h2>
						</div>
						<input
							aria-label="封面路径"
							className="native-field"
							placeholder="封面路径"
							value={draft.assets.cover}
							onChange={(event) =>
								updateDraft('assets', { ...draft.assets, cover: event.target.value })
							}
						/>
						<input
							aria-label="演示路径"
							className="native-field"
							placeholder="演示路径"
							value={draft.assets.demo ?? ''}
							onChange={(event) =>
								updateDraft('assets', { ...draft.assets, demo: event.target.value })
							}
						/>
						<label className="rounded-[18px] bg-white/72 px-4 py-3 text-sm">
							上传封面
							<input className="mt-3 block w-full" type="file" onChange={(event) => void handleAssetUpload('cover', event)} />
						</label>
						<label className="rounded-[18px] bg-white/72 px-4 py-3 text-sm">
							上传演示
							<input className="mt-3 block w-full" type="file" onChange={(event) => void handleAssetUpload('demo', event)} />
						</label>
						<input
							aria-label="代码许可"
							className="native-field"
							placeholder="代码许可"
							value={draft.license.code}
							onChange={(event) =>
								updateDraft('license', { ...draft.license, code: event.target.value })
							}
						/>
						<input
							aria-label="媒体许可"
							className="native-field"
							placeholder="媒体许可"
							value={draft.license.media}
							onChange={(event) =>
								updateDraft('license', { ...draft.license, media: event.target.value })
							}
						/>
						<input
							aria-label="第三方声明路径"
							className="native-field lg:col-span-2"
							placeholder="第三方声明路径"
							value={draft.license.thirdPartyNotice}
							onChange={(event) =>
								updateDraft('license', {
									...draft.license,
									thirdPartyNotice: event.target.value
								})
							}
						/>
						<textarea
							aria-label="第三方声明正文"
							className="native-textarea lg:col-span-2"
							placeholder="第三方声明正文"
							value={draft.license.thirdPartyText ?? ''}
							onChange={(event) =>
								updateDraft('license', {
									...draft.license,
									thirdPartyText: event.target.value
								})
							}
						/>
					</Card.Content>
				</Card>

				<FileEditor
					files={draft.codeFiles}
					title="代码文件"
					onChange={(next) => updateDraft('codeFiles', next)}
				/>
				<FileEditor
					files={draft.promptFiles}
					title="Prompt 文件"
					onChange={(next) => updateDraft('promptFiles', next)}
				/>

				{validation ? (
					<Card className="surface-panel rounded-[24px]">
						<Card.Content className="grid gap-3 p-5">
							<h3 className="display-title m-0 text-2xl">检查项</h3>
							<div className="rounded-[18px] bg-white/72 px-4 py-3 text-sm">
								{validation.ok ? '校验通过' : '校验未通过'}
							</div>
							{validation.issues.map((issue) => (
								<div key={`${issue.code}-${issue.message}`} className="rounded-[18px] bg-[#fff5e9] px-4 py-3 text-sm text-[var(--app-warning)]">
									<strong>{issue.code}</strong> {issue.message}
									{issue.path ? ` (${issue.path})` : ''}
								</div>
							))}
						</Card.Content>
					</Card>
				) : null}

				<div className="flex flex-wrap gap-3">
					{isNew ? (
						<Button className="bg-[var(--app-accent)] text-white" isDisabled={saving} type="submit">
							{saving ? '创建中…' : '创建内容'}
						</Button>
					) : (
						<Button className="bg-[var(--app-accent)] text-white" isDisabled={saving} onPress={handleSave}>
							{saving ? '保存中…' : '保存修改'}
						</Button>
					)}
					<Button className="bg-white/75" onPress={() => navigate('/studio/snippets')}>
						返回列表
					</Button>
					{dirty && !isNew ? (
						<div className="rounded-full bg-[#fdf5e8] px-4 py-2 text-sm text-[var(--app-warning)]">
							你有未保存修改
						</div>
					) : null}
				</div>
			</form>
		</div>
	);
}
