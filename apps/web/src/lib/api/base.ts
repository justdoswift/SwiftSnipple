export function resolveApiBase(value: string | undefined) {
	return (value ?? '').trim().replace(/\/+$/, '');
}

export function buildApiURL(path: string, base = import.meta.env.VITE_API_BASE_URL) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const normalizedBase = resolveApiBase(base);

	return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
}
