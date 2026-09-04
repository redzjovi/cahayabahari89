<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Products — Cahaya Bahari 89</title></svelte:head>

<section class="mx-auto max-w-6xl px-4 pb-8 pt-12">
	<SectionHead eyebrow={t().nav.products} title={t().katalog.title} sub={t().katalog.sub} />

	<form method="GET" class="mt-8 flex flex-wrap items-center gap-2">
		<input name="q" value={data.q ?? ''} placeholder={t().katalog.search} class="min-w-0 flex-1 rounded-full border px-5 py-3 sm:max-w-xs" />
		{#if data.categories && (data.categories as any[]).length}
			<div class="flex flex-wrap gap-2">
				<a
					href="/katalog"
					class="rounded-full border px-4 py-2.5 text-sm font-bold transition {!data.cat ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface hover:border-brand'}"
				>{t().katalog.catAll}</a>
				{#each data.categories as c}
					<a
						href="/katalog?cat={(c as any).slug}"
						class="rounded-full border px-4 py-2.5 text-sm font-bold transition {data.cat === (c as any).slug ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface hover:border-brand'}"
					>{(c as any).name}</a>
				{/each}
			</div>
		{/if}
		<button type="submit" class="rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-ink transition hover:brightness-110">{t().katalog.filter}</button>
	</form>

	<p class="mt-4 text-sm text-muted">{data.total} products</p>

	{#if data.error}
		<p class="mt-4 rounded-card bg-amber-500/10 p-4 text-amber-600">{data.error}</p>
	{/if}

	<div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.products as p, i}
			<ProductCard product={p} badge={data.page === 1 && !data.q && !data.cat && i < 2} />
		{:else}
			<p class="col-span-3 rounded-card border border-dashed border-line p-8 text-center text-muted">
				{t().katalog.empty}<br /><span class="text-sm">{t().katalog.seedHint}</span>
			</p>
		{/each}
	</div>

	{#if data.total > data.limit}
		<div class="mt-10 flex items-center justify-center gap-3">
			{#if data.page > 1}<a href="/katalog?page={data.page-1}&q={data.q ?? ''}&cat={data.cat ?? ''}" class="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold hover:border-brand">{t().katalog.prev}</a>{/if}
			<span class="px-3 py-1 text-sm text-muted">{t().katalog.page} {data.page} {t().katalog.of} {Math.ceil(data.total / data.limit)}</span>
			{#if data.page * data.limit < data.total}<a href="/katalog?page={data.page+1}&q={data.q ?? ''}&cat={data.cat ?? ''}" class="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold hover:border-brand">{t().katalog.next}</a>{/if}
		</div>
	{/if}
</section>
