import { browser } from '$app/environment';

export type ThemeName =
	| 'fresh-ocean'
	| 'salmon-premium'
	| 'aqua-fresh'
	| 'arctic-fresh'
	| 'soft-coastal';

const STORAGE_KEY = 'cb89-theme';

export const THEMES: { id: ThemeName; label: string; mood: string; swatch: string }[] = [
	{ id: 'fresh-ocean', label: 'Fresh Ocean', mood: 'Fresh, clean, trustworthy premium', swatch: '#287c86' },
	{ id: 'salmon-premium', label: 'Salmon Premium', mood: 'Elegant editorial luxury', swatch: '#c96f67' },
	{ id: 'aqua-fresh', label: 'Aqua Fresh', mood: 'Natural, healthy, ocean-fresh', swatch: '#3b8587' },
	{ id: 'arctic-fresh', label: 'Arctic Fresh', mood: 'Scandinavian minimal exporter', swatch: '#4c858a' },
	{ id: 'soft-coastal', label: 'Soft Coastal', mood: 'Friendly direct-to-consumer', swatch: '#f49b8f' }
];

export const DEFAULT_THEME: ThemeName = 'fresh-ocean';

function isThemeName(value: unknown): value is ThemeName {
	return THEMES.some((t) => t.id === value);
}

class ThemeStore {
	current = $state<ThemeName>(DEFAULT_THEME);

	/** Read persisted choice (client only) and apply without flash. */
	init() {
		if (!browser) return;
		const saved = localStorage.getItem(STORAGE_KEY);
		if (isThemeName(saved)) this.apply(saved);
	}

	set(name: ThemeName) {
		this.apply(name);
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEY, name);
			} catch {
				// private mode etc. — theme still applies for this session
			}
		}
	}

	private apply(name: ThemeName) {
		this.current = name;
		if (browser) document.documentElement.dataset.theme = name;
	}
}

export const theme = new ThemeStore();
