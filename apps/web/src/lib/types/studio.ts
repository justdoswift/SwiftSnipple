export type AdminSessionResponse = {
	authenticated: boolean;
	username: string;
};

export type AdminSnippetListItem = {
	id: string;
	title: string;
	summary: string;
	categoryPrimary: string;
	difficulty: string;
	version: string;
	state: string;
	publishedVersion?: string;
	hasCover: boolean;
	hasDemo: boolean;
	updatedAt: string;
};

export type AdminEditableFile = {
	path: string;
	label: string;
	kind?: string;
	content: string;
};

export type AdminPlatform = {
	os: string;
	minVersion: string;
};

export type AdminAssets = {
	cover: string;
	demo?: string;
	coverPreviewUrl?: string;
	demoPreviewUrl?: string;
};

export type AdminLicense = {
	code: string;
	media: string;
	thirdPartyNotice: string;
	thirdPartyText?: string;
};

export type AdminSnippetEditorPayload = {
	id: string;
	title: string;
	summary: string;
	categoryPrimary: string;
	difficulty: string;
	version: string;
	state: string;
	sourceRevision: string;
	tags: string[];
	platforms: AdminPlatform[];
	assets: AdminAssets;
	license: AdminLicense;
	codeFiles: AdminEditableFile[];
	promptFiles: AdminEditableFile[];
};

export type AdminValidationIssue = {
	code: string;
	message: string;
	path?: string;
};

export type AdminValidationResponse = {
	ok: boolean;
	issues: AdminValidationIssue[];
};

export type AdminSnippetCollection = {
	items: AdminSnippetListItem[];
};

export type AdminCreateSnippetRequest = {
	id: string;
	title: string;
	summary: string;
	categoryPrimary: string;
	difficulty: string;
	version: string;
};
