<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize, parseLocalized } from '$lib/routes';
	import { page } from '$app/state';
	import { reveal } from '$lib/reveal';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';

	let { data } = $props();
	const p = $derived(data.product as any);
	const gallery = $derived((p.images ?? []) as { url?: string; alt?: string | null }[]);
	let selected = $state(0);

	function thumbKeys(e: KeyboardEvent, i: number) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + gallery.length) % gallery.length;
		selected = n;
		document.getElementById(`thumb-${n}`)?.focus();
	}

	const WA_NUMBER = '6287877118199';
	const waLink = $derived(
		`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hello, I'm interested in ${p.name} (${p.sku ?? p.slug})`)}`
	);

	function idr(n: number) {
		return n.toLocaleString(locale.current === 'id' ? 'id-ID' : 'en-US');
	}

	/**
	 * Smart back: if the visitor arrived from the filtered products list,
	 * go back() to preserve filters, page, and scroll. Otherwise fall through
	 * to the plain list href (direct visits, new tabs, shared links).
	 * Runs only on click, so document/history access is client-safe.
	 */
	function goBack(e: MouseEvent) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		try {
			const ref = new URL(document.referrer);
			if (ref.origin !== location.origin) return;
			const parsed = parseLocalized(ref.pathname);
			if (parsed && parsed.internal === '/products') {
				e.preventDefault();
				history.back();
			}
		} catch {
			// fall through to href
		}
	}
</script>

<svelte:head>
	<title>{p.name} — Cahaya Bahari 89</title>
	<meta name="description" content={p.description ?? p.name} />
	<meta property="og:title" content={p.name} />
	<meta property="og:description" content={p.description ?? p.name} />
	<link rel="canonical" href="{page.url.origin}{localize(`/products/${p.slug}`, locale.current)}" />
</svelte:head>

<section class="content-wrap pb-6 pt-8">
	<a href={localize('/products', locale.current)} onclick={goBack} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().detail.back}</a>

	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
		<div>
			{#if gallery.length && gallery[Math.min(selected, gallery.length - 1)]?.url}
				{@const current = gallery[Math.min(selected, gallery.length - 1)]}
				<div
					role="region"
					aria-roledescription="carousel"
					aria-label={p.name}
					aria-live="polite"
					class="overflow-hidden rounded-card border border-line bg-surface shadow-card"
				>
					<img src={current.url} alt={current.alt ?? p.name} class="aspect-[4/3] w-full object-cover" loading="eager" />
				</div>
				{#if gallery.length > 1}
					<div class="mt-3 flex gap-3 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
						{#each gallery as img, i}
							<button
								type="button"
								role="tab"
								id={`thumb-${i}`}
								aria-selected={i === selected}
								aria-label={`Image ${i + 1}`}
								onclick={() => (selected = i)}
								onkeydown={(e) => thumbKeys(e, i)}
								class="w-24 shrink-0 overflow-hidden rounded-lg border-2 transition {i === selected ? 'border-brand' : 'border-line opacity-70 hover:opacity-100'}"
							>
								{#if img.url}
									<img src={img.url} alt="" class="aspect-[4/3] w-full object-cover" loading="lazy" />
								{:else}
									<PhotoPlaceholder label={`${i + 1}`} aspect="aspect-[4/3]" rounded={false} />
								{/if}
							</button>
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
			<p class="mt-1 font-mono text-sm font-normal text-muted">{p.slug}</p>
			<p class="mt-2 font-display text-3xl font-bold text-brand">Rp {idr(p.price)}<span class="text-base font-medium text-muted">{t().katalog.per}</span></p>
			<p class="mt-4 leading-relaxed text-muted">{p.description ?? t().detail.noDesc}</p>

			<div class="mt-5 flex flex-wrap gap-3">
				<a href={waLink} target="_blank" rel="noreferrer" class="rounded-full bg-brand px-4 py-2 font-bold text-brand-ink transition hover:brightness-110">WhatsApp Order</a>
			</div>

			<div class="mt-6 overflow-hidden rounded-card border border-line">
				<h2 class="border-b border-line bg-band px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em]">{t().detail.specs}</h2>
				<dl class="divide-y divide-line text-sm">
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-muted">SKU</dt><dd class="font-semibold">{p.sku ?? '-'}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-muted">{t().detail.category}</dt><dd class="font-semibold">{p.category?.name ?? '-'}</dd></div>
				</dl>
			</div>
		</div>
	</div>

	{#if (data.related as any[]).length}
		<div class="mt-10">
			<h2 class="font-display text-2xl font-bold">{t().detail.related}</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
				{#each data.related as r}
					<ProductCard product={r} />
				{/each}
			</div>
		</div>
	{/if}
</section>
