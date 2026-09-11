<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import WaveDivider from '$lib/components/WaveDivider.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';

	let { data } = $props();

	// CMS content with hardcoded fallback (ID is source of truth; EN falls back to ID server-side).
	// Data is static per SSR load (remounts on nav), so capturing initial value is intended.
	// svelte-ignore state_referenced_locally
	function cx(key: string, fallback: string): string {
		const body = (data.sections as Record<string, { body?: string | null }>)[key]?.body?.trim();
		return body ? body! : fallback;
	}
	// svelte-ignore state_referenced_locally
	const heroImg = (data.sections as Record<string, { imageUrl?: string | null }>)['hero.image_url']?.imageUrl?.trim() || '';
	// svelte-ignore state_referenced_locally
	const heroTitleFallback = `${t().hero.titleA} ${t().hero.titleB}`;
	const heroCta = locale.current === 'id' ? 'Hubungi kami' : 'Contact us';
</script>

<svelte:head>
	<title>Cahaya Bahari 89 — Premium Salmon & Fresh Fish</title>
	<meta name="description" content="Cahaya Bahari 89 — premium salmon and fresh fish supplier. Browse the catalog, check prices, contact sales." />
</svelte:head>

<section data-section="hero" class="content-wrap grid items-center gap-6 pb-10 pt-8 lg:grid-cols-2 lg:gap-8 lg:pb-16">
	<div>
		<span class="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">{cx('hero.badge', t().hero.badge)}</span>
		<h1 class="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
			<span class="hero-gradient">{cx('hero.title', heroTitleFallback)}</span>
		</h1>
		<p class="mt-4 max-w-xl text-lg leading-relaxed text-muted">{cx('hero.sub', t().hero.sub)}</p>
		<div class="mt-6 flex flex-wrap gap-3">
			<a href={localize('/products', locale.current)} class="rounded-full bg-brand px-4 py-2 font-bold text-brand-ink transition hover:brightness-110">{t().hero.ctaProducts}</a>
			<a href={localize('/contact', locale.current)} class="rounded-full border border-line bg-surface px-4 py-2 font-bold transition hover:border-brand hover:text-brand">{heroCta}</a>
		</div>
	</div>
	{#if heroImg}
		<img src={heroImg} alt="Salmon hero" class="aspect-[4/3] w-full rounded-card border border-line object-cover" loading="eager" />
	{:else}
		<PhotoPlaceholder label="Salmon hero photo" aspect="aspect-[4/3]" />
	{/if}
</section>

<div data-section="wave-divider"><WaveDivider /></div>

<section data-section="featured-products" class="content-wrap py-10">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<SectionHead eyebrow={t().featured.eyebrow} title={t().featured.title} sub={t().featured.sub} />
		<a href={localize('/products', locale.current)} class="font-bold text-brand hover:underline">{t().featured.viewAll} →</a>
	</div>
	{#if data.featured.length}
		<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.featured as p, i}
				<ProductCard product={p} badge={i === 0} />
			{/each}
		</div>
	{:else}
		<p use:reveal class="mt-6 rounded-card border border-dashed border-line p-6 text-center text-muted">
			{t().katalog.empty} {t().katalog.seedHint}
		</p>
	{/if}
</section>

<section data-section="cta" class="content-wrap pb-4">
	<div use:reveal class="rounded-card bg-brand px-6 py-8 text-center text-brand-ink shadow-card sm:px-10">
		<h2 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">{cx('cta.title', t().cta.title)}</h2>
		<p class="mx-auto mt-3 max-w-xl opacity-80">{cx('cta.sub', t().cta.sub)}</p>
		<a href={localize('/contact', locale.current)} class="mt-5 inline-block rounded-full bg-accent px-4 py-2 font-bold text-accent-ink transition hover:brightness-110">{cx('cta.button', t().cta.button)}</a>
	</div>
</section>
