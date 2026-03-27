import { describe, expect, it } from 'vitest';
import { buildApiURL, resolveApiBase } from './base';

describe('resolveApiBase', () => {
	it('drops surrounding whitespace and trailing slashes', () => {
		expect(resolveApiBase(' https://api.example.com/// ')).toBe('https://api.example.com');
	});

	it('keeps empty values empty', () => {
		expect(resolveApiBase(undefined)).toBe('');
		expect(resolveApiBase('')).toBe('');
	});
});

describe('buildApiURL', () => {
	it('keeps relative api paths when no base is configured', () => {
		expect(buildApiURL('/api/v1/discovery/feed', undefined)).toBe('/api/v1/discovery/feed');
	});

	it('prefixes the configured base url once', () => {
		expect(buildApiURL('api/v1/discovery/feed', 'https://api.example.com/')).toBe(
			'https://api.example.com/api/v1/discovery/feed'
		);
	});
});
