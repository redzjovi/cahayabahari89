<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { reveal } from '$lib/reveal';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';

	let { data } = $props();
	const p = $derived(data.product as any);

	const WA_NUMBER = '6287877118199';
	const waLink = $derived(
		`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hello, I'm interested in ${p.name} (${p.sku ?? p.slug})`)}`
	);

	function idr(n: number) {
		return n.toLocaleString(locale.current === 'id' ? 'id-ID' : 'en-US');
	}
</script>

<svelte:head>
	<title>{p.name} — Cahaya Bahari 89</title>
	<meta name="description" content={p.description ?? p.name} />
	<meta property="og:title" content={p.name} />
	<meta property="og:description" content={p.description ?? p.name} />
</svelte:head>

<section class="content-wrap pb-6 pt-8">
	<a href={localize('/products', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().detail.back}</a>

	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
		<div>
			{#if p.images?.length}
				<PhotoPlaceholder label={p.images[0].alt ?? p.name} aspect="aspect-[4/3]" />
				{#if p.images.length > 1}
					<div class="mt-3 grid grid-cols-3 gap-3">
						{#each p.images.slice(1, 4) as img}
							<PhotoPlaceholder label={img.alt ?? p.name} aspect="aspect-[4/3]" />
						{/each}
					</div>
				{/if}
			{:else}
				<PhotoPlaceholder label={p.name} aspect="aspect-[4/3]" />
			{/if}
		</div>

		<div use:reveal>
			{#if p.category}
				<a href={localize(`/products?cat=${p.category.slug}`, locale.current)} class="inline-block rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-strong">{p.category.name}</a>
			{/if}
			<h1 class="mt-3 font-display text-4xl font-bold tracking-tight">{p.name}</h1>
			<p class="mt-2 font-display text-3xl font-bold text-brand">Rp {idr(p.price)}<span class="text-base font-medium text-muted">{t().katalog.per}</span></p>
			<p class="mt-4 leading-relaxed text-muted">{p.description ?? t().detail.noDesc}</p>

			<div class="mt-5 flex flex-wrap gap-3">
				<a href={waLink} target="_blank" rel="noreferrer" class="rounded-full bg-brand px-4 py-2 font-bold text-brand-ink transition hover:brightness-110">WhatsApp Order</a>
				<a href={localize('/contact', locale.current)} class="rounded-full border border-line bg-surface px-4 py-2 font-bold transition hover:border-brand hover:text-brand">{t().detail.ask}</a>
			</div>

			<div class="mt-6 overflow-hidden rounded-card border border-line">
				<h2 class="border-b border-line bg-band px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em]">{t().detail.specs}</h2>
				<dl class="divide-y divide-line text-sm">
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-muted">SKU</dt><dd class="font-semibold">{p.sku ?? '-'}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-muted">{t().detail.category}</dt><dd class="font-semibold">{p.category?.name ?? '-'}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-muted">Storage</dt><dd class="font-semibold">0–4°C</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-muted">Origin</dt><dd class="font-semibold">Certified waters</dd></div>
				</dl>
			</div>
		</div>
	</div>

	{#if (data.related as any[]).length}
		<div class="mt-10">
			<h2 class="font-display text-2xl font-bold">{t().detail.related}</h2>
			<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.related as r}
					<ProductCard product={r} />
				{/each}
			</div>
		</div>
	{/if}
</section>
