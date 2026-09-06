<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ThemePicker from '$lib/components/ThemePicker.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import FishMark from '$lib/components/FishMark.svelte';
	import { t, locale } from '$lib/locale.svelte';
	import { localize, parseLocalized } from '$lib/routes';
	import { page } from '$app/state';
	import '../app.css';

	let { children, data } = $props();
	let menuOpen = $state(false);

	// URL (via +layout.server.ts) is the locale source of truth.
	// Direct assignment runs synchronously during each SSR render pass
	// (single-threaded: assignment + render are atomic per request).
	// The $effect below handles client-side navs, persistence, <html lang>.
	// svelte-check may warn that this captures data's initial value — intended.
	locale.current = data.locale;
	$effect(() => {
		locale.set(data.locale);
	});

	const alternates = $derived.by(() => {
		const parsed = parseLocalized(page.url.pathname);
		const internal = parsed ? parsed.internal : page.url.pathname;
		return {
			en: page.url.origin + localize(internal + page.url.search, 'en'),
			id: page.url.origin + localize(internal + page.url.search, 'id')
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="alternate" hreflang="en" href={alternates.en} />
	<link rel="alternate" hreflang="id" href={alternates.id} />
	<link rel="alternate" hreflang="x-default" href={alternates.id} />
</svelte:head>

<header class="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
	<nav class="content-wrap flex items-center justify-between gap-3 py-3">
		<a href={localize('/', data.locale)} class="flex items-center gap-2 text-lg font-extrabold tracking-tight">
			<FishMark cls="h-7 w-7 text-accent-strong" />
			Cahaya Bahari 89
		</a>
		<div class="hidden items-center gap-5 text-sm font-semibold md:flex">
			<a href={localize('/products', data.locale)} class="hover:text-brand">{t().nav.products}</a>
			<a href={localize('/contact', data.locale)} class="hover:text-brand">{t().nav.contact}</a>
		</div>
		<div class="hidden items-center gap-2 md:flex">
			<LangToggle />
			<ThemePicker />
		</div>
		<button
			type="button"
			class="rounded-lg border border-line p-2 md:hidden"
			aria-label="Menu"
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
		</button>
	</nav>
	{#if menuOpen}
		<div class="border-t border-line px-4 py-3 md:hidden">
			<div class="flex flex-col gap-1 text-sm font-semibold">
				<a href={localize('/products', data.locale)} onclick={() => (menuOpen = false)} class="rounded-lg px-3 py-2 hover:bg-band">{t().nav.products}</a>
				<a href={localize('/contact', data.locale)} onclick={() => (menuOpen = false)} class="rounded-lg px-3 py-2 hover:bg-band">{t().nav.contact}</a>
			</div>
			<div class="mt-3 flex items-center gap-2">
				<LangToggle />
				<ThemePicker />
			</div>
		</div>
	{/if}
</header>

<main>
	{@render children()}
</main>

<footer class="mt-16 bg-brand text-brand-ink">
	<div class="content-wrap grid gap-8 py-8 sm:grid-cols-2">
		<div>
			<span class="flex items-center gap-2 text-lg font-extrabold">
				<FishMark cls="h-6 w-6 text-accent" />
				Cahaya Bahari 89
			</span>
			<p class="mt-3 text-sm opacity-80">{t().footer.tagline}</p>
		</div>
		<div>
			<h4 class="text-sm font-bold uppercase tracking-[0.14em] opacity-70">{t().footer.follow}</h4>
			<!-- TODO: replace placeholder URLs below with real social profile URLs -->
			<div class="mt-3 flex gap-2.5">
				<a href="https://www.facebook.com/cahayabahari89" target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition hover:border-accent hover:text-accent">
					<svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5Z" /></svg>
				</a>
				<a href="https://www.instagram.com/cahayabahari89" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition hover:border-accent hover:text-accent">
					<svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" /></svg>
				</a>
				<a href="https://www.youtube.com/@cahayabahari89" target="_blank" rel="noreferrer" aria-label="YouTube" title="YouTube" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition hover:border-accent hover:text-accent">
					<svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="M10.5 9.8v4.4L14.5 12l-4-2.2Z" fill="currentColor" stroke="none" /></svg>
				</a>
				<a href="https://www.tiktok.com/@cahayabahari89" target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok" class="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition hover:border-accent hover:text-accent">
					<svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="currentColor" aria-hidden="true"><path d="M15.5 4v9.8c0 2.5-1.9 4.2-4.2 4.2-2.2 0-4-1.7-4-3.9 0-2.1 1.7-3.8 3.9-3.8.3 0 .7 0 1 .1v2.6c-.3-.1-.6-.2-1-.2-.8 0-1.4.6-1.4 1.3 0 .8.6 1.4 1.5 1.4.9 0 1.6-.7 1.6-1.7V4h2.6Z" /></svg>
				</a>
			</div>
		</div>
	</div>
	<div class="border-t border-white/15">
		<div class="content-wrap flex flex-wrap items-center justify-between gap-2 py-4 text-xs opacity-70">
			<span>© {new Date().getFullYear()} Cahaya Bahari 89 — {t().footer.rights}</span>
			<span>{data.locale === 'id' ? 'ID' : 'EN'} • SvelteKit + Hono on Cloudflare</span>
		</div>
	</div>
</footer>
