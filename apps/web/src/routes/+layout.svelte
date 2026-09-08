<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ThemePicker from '$lib/components/ThemePicker.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import FishMark from '$lib/components/FishMark.svelte';
	import { t, locale } from '$lib/locale.svelte';
	import { localize, parseLocalized } from '$lib/routes';
	import { cartQty } from '$lib/cart.svelte';
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

	const isAdmin = $derived.by(() => {
		const parsed = parseLocalized(page.url.pathname);
		const internal = parsed ? parsed.internal : page.url.pathname;
		return internal === '/admin' || internal.startsWith('/admin/');
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

{#if !isAdmin}
<header class="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
	<nav class="content-wrap flex items-center justify-between gap-3 py-3">
		<button
			type="button"
			class="rounded-lg border border-line p-2 md:hidden"
			aria-label="Menu"
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<a href={localize('/', data.locale)} class="flex items-center gap-2 text-lg font-extrabold tracking-tight md:flex-1">
			<FishMark cls="h-7 w-7 text-accent-strong" />
			Cahaya Bahari 89
		</a>
		<div class="hidden items-center gap-5 text-sm font-semibold md:flex">
			<a href={localize('/products', data.locale)} class="hover:text-brand">{t().nav.products}</a>
			<a href={localize('/about', data.locale)} class="hover:text-brand">{t().nav.about}</a>
			<a href={localize('/contact', data.locale)} class="hover:text-brand">{t().nav.contact}</a>
		</div>
		<div class="hidden items-center gap-2 md:flex">
			<a href={localize('/cart', data.locale)} class="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-bold transition hover:border-brand hover:text-brand">
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 11-4 0v-4M9 19a2 2 0 102 2 2 2 0 10-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span class="text-sm">{$cartQty}</span>
			</a>
			<LangToggle />
			<ThemePicker />
		</div>
		<a href={localize('/cart', data.locale)} class="relative rounded-lg border border-line p-2 md:hidden" aria-label="Cart">
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 11-4 0v-4M9 19a2 2 0 102 2 2 2 0 10-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			{#if $cartQty > 0}
				<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] text-brand-ink font-bold">{$cartQty > 99 ? '99+' : $cartQty}</span>
			{/if}
		</a>
	</nav>
</header>
{#if menuOpen}
	<div class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onclick={() => (menuOpen = false)}></div>
{/if}
<aside class="fixed top-0 left-0 bottom-0 z-50 flex w-64 flex-col border-r border-line bg-bg/95 backdrop-blur transition-transform duration-200 md:hidden" class:translate-x-0={menuOpen} class:-translate-x-full={!menuOpen}>
	<div class="flex flex-col gap-1 p-4">
		<a href={localize('/products', data.locale)} onclick={() => (menuOpen = false)} class="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-band">
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 11-4 0v-4M9 19a2 2 0 102 2 2 2 0 10-2-2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
			<span class="font-semibold">{t().nav.products}</span>
		</a>
		<a href={localize('/about', data.locale)} onclick={() => (menuOpen = false)} class="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-band">
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 1.1.3 2.2.8 3.2L5 17h14l-1-4.8c.5-1 .8-2.1.8-3.2 0-3.87-3.13-7-7-7z" stroke-linecap="round" stroke-linejoin="round"/></svg>
			<span class="font-semibold">{t().nav.about}</span>
		</a>
		<a href={localize('/contact', data.locale)} onclick={() => (menuOpen = false)} class="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-band">
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
			<span class="font-semibold">{t().nav.contact}</span>
		</a>
	</div>
	<div class="flex items-center gap-3 border-t border-line p-4">
		<div class="flex-1">
			<LangToggle />
		</div>
		<div class="flex-1">
			<ThemePicker />
		</div>
	</div>
</aside>
{/if}

<main>
	{@render children()}
</main>

{#if !isAdmin}
<footer class="mt-16 bg-brand text-brand-ink">
	<div class="content-wrap grid gap-8 py-8 sm:grid-cols-2">
		<div>
			<span class="flex items-center gap-2 text-lg font-extrabold">
				<FishMark cls="h-6 w-6 text-accent" />
				Cahaya Bahari 89
			</span>
			<p class="mt-3 text-sm opacity-80">{t().footer.tagline}</p>
			<a href={localize('/about', data.locale)} class="mt-3 inline-block text-sm font-semibold underline opacity-80 hover:opacity-100">{t().nav.about} →</a>
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
{/if}
