export function formatDate(value: string) {
	try {
		return new Intl.DateTimeFormat('zh-CN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(value));
	} catch {
		return value;
	}
}

export function difficultyLabel(value: string) {
	const map: Record<string, string> = {
		easy: '轻量可复用',
		medium: '中等复杂度',
		hard: '工程级片段'
	};

	return map[value] ?? value;
}

export function stateLabel(value: string) {
	const map: Record<string, string> = {
		draft: '草稿',
		review: '待发布',
		published: '已发布'
	};

	return map[value] ?? value;
}

export function categoryLabel(value: string) {
	const map: Record<string, string> = {
		layout: '布局',
		animation: '动效',
		state: '状态',
		ai: 'AI 协作',
		component: '组件',
		navigation: '导航'
	};

	return map[value] ?? value;
}

export function parseTags(value: string) {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

export function parsePlatforms(value: string) {
	return value
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [os, minVersion = ''] = line.split(':');
			return {
				os: os?.trim() ?? '',
				minVersion: minVersion.trim()
			};
		})
		.filter((platform) => platform.os);
}

export function formatPlatforms(
	platforms: {
		os: string;
		minVersion: string;
	}[]
) {
	return platforms.map((platform) => `${platform.os}:${platform.minVersion}`).join('\n');
}
