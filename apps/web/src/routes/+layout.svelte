<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ThemePicker from '$lib/components/ThemePicker.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import FishMark from '$lib/components/FishMark.svelte';
	import { t, locale } from '$lib/locale.svelte';
	import '../app.css';

	let { children } = $props();
	let menuOpen = $state(false);

	const WA_NUMBER = '6281234567890';
	const waLink = `https://wa.me/${WA_NUMBER}?text=Hello%20Cahaya%20Bahari%2089`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
	<nav class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
		<a href="/" class="flex items-center gap-2 text-lg font-extrabold tracking-tight">
			<FishMark cls="h-7 w-7 text-accent-strong" />
			Cahaya Bahari 89
		</a>
		<div class="hidden items-center gap-5 text-sm font-semibold md:flex">
			<a href="/" class="hover:text-brand">{t().nav.home}</a>
			<a href="/about" class="hover:text-brand">{t().nav.about}</a>
			<a href="/services" class="hover:text-brand">{t().nav.quality}</a>
			<a href="/katalog" class="hover:text-brand">{t().nav.products}</a>
			<a href="/contact" class="hover:text-brand">{t().nav.contact}</a>
		</div>
		<div class="hidden items-center gap-2 md:flex">
			<LangToggle />
			<ThemePicker />
			<a href={waLink} target="_blank" rel="noreferrer" class="rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-ink transition hover:brightness-110">{t().nav.order}</a>
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
				<a href="/" onclick={() => (menuOpen = false)} class="rounded-lg px-3 py-2.5 hover:bg-band">{t().nav.home}</a>
				<a href="/about" onclick={() => (menuOpen = false)} class="rounded-lg px-3 py-2.5 hover:bg-band">{t().nav.about}</a>
				<a href="/services" onclick={() => (menuOpen = false)} class="rounded-lg px-3 py-2.5 hover:bg-band">{t().nav.quality}</a>
				<a href="/katalog" onclick={() => (menuOpen = false)} class="rounded-lg px-3 py-2.5 hover:bg-band">{t().nav.products}</a>
				<a href="/contact" onclick={() => (menuOpen = false)} class="rounded-lg px-3 py-2.5 hover:bg-band">{t().nav.contact}</a>
			</div>
			<div class="mt-3 flex items-center gap-2">
				<LangToggle />
				<ThemePicker />
				<a href={waLink} target="_blank" rel="noreferrer" class="flex-1 rounded-full bg-brand px-4 py-2.5 text-center text-sm font-bold text-brand-ink">{t().nav.order}</a>
			</div>
		</div>
	{/if}
</header>

<main>
	{@render children()}
</main>

<footer class="mt-16 bg-brand text-brand-ink">
	<div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
		<div>
			<span class="flex items-center gap-2 text-lg font-extrabold">
				<FishMark cls="h-6 w-6 text-accent" />
				Cahaya Bahari 89
			</span>
			<p class="mt-3 text-sm opacity-80">{t().footer.tagline}</p>
		</div>
		<div>
			<h4 class="text-sm font-bold uppercase tracking-[0.14em] opacity-70">{t().footer.products}</h4>
			<ul class="mt-3 space-y-2 text-sm">
				<li><a href="/katalog" class="hover:underline">Salmon Fillet</a></li>
				<li><a href="/katalog" class="hover:underline">Whole Salmon</a></li>
				<li><a href="/katalog" class="hover:underline">Smoked Salmon</a></li>
				<li><a href="/katalog" class="hover:underline">Fresh Fish</a></li>
			</ul>
		</div>
		<div>
			<h4 class="text-sm font-bold uppercase tracking-[0.14em] opacity-70">{t().footer.company}</h4>
			<ul class="mt-3 space-y-2 text-sm">
				<li><a href="/about" class="hover:underline">{t().nav.about}</a></li>
				<li><a href="/services" class="hover:underline">{t().nav.quality}</a></li>
				<li><a href="/katalog" class="hover:underline">{t().nav.products}</a></li>
				<li><a href="/contact" class="hover:underline">{t().nav.contact}</a></li>
			</ul>
		</div>
		<div>
			<h4 class="text-sm font-bold uppercase tracking-[0.14em] opacity-70">{t().footer.contact}</h4>
			<ul class="mt-3 space-y-2 text-sm">
				<li><a href={waLink} target="_blank" rel="noreferrer" class="hover:underline">WhatsApp: +62 812-3456-7890</a></li>
				<li><a href="/contact" class="hover:underline">sales@cahayabahari89.id</a></li>
				<li class="opacity-80">Jakarta, Indonesia</li>
			</ul>
		</div>
	</div>
	<div class="border-t border-white/15">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs opacity-70">
			<span>© {new Date().getFullYear()} Cahaya Bahari 89 — {t().footer.rights}</span>
			<span>{locale.current === 'id' ? 'ID' : 'EN'} • SvelteKit + Hono on Cloudflare</span>
		</div>
	</div>
</footer>
