<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import CertBadge from '$lib/components/CertBadge.svelte';
	import WaveDivider from '$lib/components/WaveDivider.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Cahaya Bahari 89 — Premium Salmon & Fresh Fish</title>
	<meta name="description" content="Cahaya Bahari 89 — premium salmon and fresh fish supplier. Browse the catalog, check prices, contact sales." />
</svelte:head>

<!-- HERO: text in 7xl measure, image stretched to right viewport edge -->
<section class="grid items-center gap-6 px-4 pb-10 pt-8 lg:grid-cols-2 lg:gap-8 lg:px-0 lg:pb-16 lg:pt-12">
	<div class="lg:pl-[max(1rem,calc((100vw-88rem)/2+2rem))] lg:pr-0">
		<span class="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">{t().hero.badge}</span>
		<h1 class="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
			{t().hero.titleA}<br />
			<span class="text-brand">{t().hero.titleB}</span>
		</h1>
		<p class="mt-4 max-w-xl text-lg leading-relaxed text-muted">{t().hero.sub}</p>
		<div class="mt-6 flex flex-wrap gap-3">
			<a href={localize('/products', locale.current)} class="rounded-full bg-brand px-4 py-2 font-bold text-brand-ink transition hover:brightness-110">{t().hero.ctaProducts}</a>
			<a href={localize('/contact', locale.current)} class="rounded-full border border-line bg-surface px-4 py-2 font-bold transition hover:border-brand hover:text-brand">{t().hero.ctaContact}</a>
		</div>
		<dl class="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
			{#each t().stats as s}
				<div>
					<dt class="sr-only">{s.label}</dt>
					<dd class="font-display text-2xl font-bold text-brand sm:text-3xl">{s.value}</dd>
					<dd class="mt-1 text-sm text-muted">{s.label}</dd>
				</div>
			{/each}
		</dl>
	</div>
	<div class="relative lg:h-full lg:min-h-[560px]">
		<div class="h-full overflow-hidden rounded-card lg:rounded-l-card lg:rounded-r-none">
			<PhotoPlaceholder label="Salmon hero photo" aspect="aspect-[16/10] lg:aspect-auto lg:h-full" rounded={false} />
		</div>
		<div class="anim-float absolute -bottom-5 left-3 flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2 shadow-card sm:left-6 lg:left-8">
			<span class="inline-block h-3 w-3 rounded-full bg-accent" aria-hidden="true"></span>
			<span>
				<span class="block text-sm font-bold">{t().hero.freshBadge}</span>
				<span class="block text-xs text-muted">0–4°C{t().hero.freshSub}</span>
			</span>
		</div>
	</div>
</section>

<WaveDivider />

<!-- FEATURED PRODUCTS -->
<section class="content-wrap py-10">
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

<!-- QUALITY BAND -->
<section class="bg-band">
	<div class="content-wrap py-10">
		<SectionHead eyebrow={t().quality.eyebrow} title={t().quality.title} sub={t().quality.sub} align="center" />
		<div class="mt-6 grid gap-4 md:grid-cols-3">
			{#each t().quality.items as q, i}
				<div use:reveal class="rounded-card border border-line bg-surface p-5 shadow-card">
					<span class="font-display text-sm font-semibold tracking-[0.2em] text-accent-strong">0{i + 1}</span>
					<h3 class="mt-2 font-display text-xl font-bold">{q.title}</h3>
					<p class="mt-2 text-muted">{q.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<WaveDivider />

<!-- CERTIFICATIONS -->
<section class="content-wrap py-10 text-center">
	<SectionHead eyebrow={t().certs.eyebrow} title={t().certs.title} align="center" />
	<div use:reveal class="mt-6 flex flex-wrap justify-center gap-3">
		{#each t().certs.items as c}
			<CertBadge label={c} />
		{/each}
	</div>
</section>

<!-- CTA -->
<section class="content-wrap pb-4">
	<div use:reveal class="rounded-card bg-brand px-6 py-8 text-center text-brand-ink shadow-card sm:px-10">
		<h2 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t().cta.title}</h2>
		<p class="mx-auto mt-3 max-w-xl opacity-80">{t().cta.sub}</p>
		<a href={localize('/contact', locale.current)} class="mt-5 inline-block rounded-full bg-accent px-4 py-2 font-bold text-accent-ink transition hover:brightness-110">{t().cta.button}</a>
	</div>
</section>
