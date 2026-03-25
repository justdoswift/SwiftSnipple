type KnownCategory = 'layout' | 'animation' | 'tooling' | 'input' | 'state' | 'navigation';
type KnownDifficulty = 'easy' | 'medium' | 'hard';

const categoryLabels: Record<KnownCategory, string> = {
	layout: '布局',
	animation: '动效',
	tooling: '工具',
	input: '交互',
	state: '状态',
	navigation: '导航'
};

const difficultyLabels: Record<KnownDifficulty, string> = {
	easy: '轻量',
	medium: '进阶',
	hard: '挑战'
};

export function categoryLabel(value: string) {
	return categoryLabels[value as KnownCategory] ?? value;
}

export function difficultyLabel(value: string) {
	return difficultyLabels[value as KnownDifficulty] ?? value;
}

export function demoAvailabilityLabel(hasDemo: boolean) {
	return hasDemo ? '含演示' : '封面预览';
}

export function promptAvailabilityLabel(hasPrompt: boolean) {
	return hasPrompt ? '含提示词' : '仅代码';
}

export function booleanLabel(value: string) {
	if (value === 'true') {
		return '有';
	}
	if (value === 'false') {
		return '无';
	}
	return value;
}

export function platformLabel(platform: { os: string; minVersion: string }) {
	return `${platform.os} ${platform.minVersion}`;
}

export function fallbackCoverUrl(id: string) {
	return `/generated-covers/${id}.svg`;
}
