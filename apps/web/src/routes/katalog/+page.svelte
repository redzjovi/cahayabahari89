<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';

	let { data } = $props();

	// Prototype curation: pinned slugs float first when sort=best.
	// Edit this list to re-curate (is_featured column is the planned upgrade).
	const CURATED = ['fillet-salmon-premium', 'smoked-salmon'];

	const sortOpts = [
		{ v: 'best', label: () => t().katalog.sortBest },
		{ v: 'name_asc', label: () => t().katalog.sortNameAsc },
		{ v: 'price_asc', label: () => t().katalog.sortPriceAsc },
		{ v: 'price_desc', label: () => t().katalog.sortPriceDesc }
	];

	/** Build a /katalog URL preserving current params with overrides. */
	function pageUrl(over: Record<string, string | undefined>) {
		const p = new URLSearchParams();
		const cur: Record<string, string | undefined> = {
			q: data.q, cat: data.cat, min: data.min, max: data.max, sort: data.sort
		};
		const merged = { ...cur, ...over, page: over.page ?? '1' };
		for (const [k, v] of Object.entries(merged)) {
			if (v) p.set(k, v);
		}
		const s = p.toString();
		return s ? `/katalog?${s}` : '/katalog';
	}

	function pageNumUrl(n: number) {
		return pageUrl({ page: String(n) });
	}

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));

	/** Page window: always 1 + last, ±1 around current, '…' for gaps. */
	const pageItems = $derived.by(() => {
		const total = totalPages;
		const cur = data.page;
		const set = new Set<number>([1, total, cur - 1, cur, cur + 1]);
		const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
		const out: (number | '…')[] = [];
		for (let i = 0; i < nums.length; i++) {
			if (i > 0 && nums[i] - nums[i - 1] > 1) out.push('…');
			out.push(nums[i]);
		}
		return out;
	});

	const ordered = $derived.by(() => {
		const list = [...(data.products as any[])];
		if ((data.sort ?? 'best') === 'best') {
			list.sort((a, b) => {
				const ia = CURATED.indexOf(a.slug);
				const ib = CURATED.indexOf(b.slug);
				return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
			});
		}
		return list;
	});
</script>

<svelte:head><title>Products — Cahaya Bahari 89</title></svelte:head>

<section class="mx-auto max-w-7xl px-4 lg:px-8 pb-8 pt-12">
	<SectionHead eyebrow={t().nav.products} title="" />

	<div class="mt-8 grid items-start gap-8 lg:grid-cols-[240px_1fr]">
		<!-- SIDEBAR: filters (collapsible on mobile, sticky on desktop) -->
		<details open class="rounded-card border border-line bg-surface shadow-card lg:sticky lg:top-24">
			<summary class="cursor-pointer list-none px-5 py-4 text-sm font-bold lg:hidden">
				{t().katalog.filters} ▾
			</summary>
			<form method="GET" action="/katalog" class="grid gap-5 border-t border-line px-5 py-5">
				<input type="hidden" name="sort" value={data.sort ?? 'best'} />
				<input type="hidden" name="q" value={data.q ?? ''} />
				<fieldset>
					<legend class="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t().katalog.category}</legend>
					<div class="mt-2.5 grid gap-1.5">
						<label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition hover:bg-bg">
							<input type="radio" name="cat" value="" checked={!data.cat} class="accent-[var(--brand)]" />
							{t().katalog.catAll}
						</label>
						{#each (data.categories as any[]) ?? [] as c}
							<label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition hover:bg-bg">
								<input type="radio" name="cat" value={c.slug} checked={data.cat === c.slug} class="accent-[var(--brand)]" />
								{c.name}
							</label>
						{/each}
					</div>
				</fieldset>
				<fieldset>
					<legend class="text-xs font-bold uppercase tracking-[0.12em] text-muted">{t().katalog.price}</legend>
					<div class="mt-2.5 grid gap-2">
						<label class="grid gap-1 text-xs font-semibold text-muted">
							{t().katalog.priceMin}
							<input type="number" name="min" min="0" step="1000" value={data.min ?? ''} placeholder="0" class="rounded-lg border px-3 py-2 text-sm font-normal text-ink" />
						</label>
						<label class="grid gap-1 text-xs font-semibold text-muted">
							{t().katalog.priceMax}
							<input type="number" name="max" min="0" step="1000" value={data.max ?? ''} placeholder="500000" class="rounded-lg border px-3 py-2 text-sm font-normal text-ink" />
						</label>
					</div>
				</fieldset>
				<div class="flex gap-2">
					<button type="submit" class="flex-1 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink transition hover:brightness-110">{t().katalog.apply}</button>
					<a href={pageUrl({ q: undefined, cat: undefined, min: undefined, max: undefined, sort: 'best' })} class="rounded-full border border-line px-4 py-2.5 text-sm font-bold transition hover:border-brand">{t().katalog.reset}</a>
				</div>
			</form>
		</details>

		<!-- MAIN: toolbar + list -->
		<div class="min-w-0">
			<form method="GET" action="/katalog" class="flex flex-wrap items-center gap-2">
				<input type="hidden" name="cat" value={data.cat ?? ''} />
				<input type="hidden" name="min" value={data.min ?? ''} />
				<input type="hidden" name="max" value={data.max ?? ''} />
				<input name="q" value={data.q ?? ''} placeholder={t().katalog.search} class="min-w-0 flex-1 rounded-full border px-5 py-2.5 text-sm" />
				<label class="flex items-center gap-2 text-sm font-semibold text-muted">
					{t().katalog.sortBy}
					<select name="sort" onchange={(e) => e.currentTarget.form?.requestSubmit()} class="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink">
						{#each sortOpts as o}
							<option value={o.v} selected={(data.sort ?? 'best') === o.v}>{o.label()}</option>
						{/each}
					</select>
				</label>
			</form>

			<p class="mt-4 text-sm text-muted">{data.total} products</p>

			{#if data.error}
				<p class="mt-4 rounded-card bg-amber-500/10 p-4 text-amber-600">{data.error}</p>
			{/if}

			<div class="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
				{#each ordered as p, i}
					<ProductCard product={p} badge={(data.sort ?? 'best') === 'best' && data.page === 1 && !data.q && !data.cat && !data.min && !data.max && CURATED.includes(p.slug)} />
				{:else}
					<p class="col-span-3 rounded-card border border-dashed border-line p-8 text-center text-muted">
						{t().katalog.empty}<br /><span class="text-sm">{t().katalog.seedHint}</span>
					</p>
				{/each}
			</div>

			{#if data.total > data.limit}
				<nav aria-label="Pagination" class="mt-10 flex items-center justify-center gap-2">
					{#if data.page > 1}
						<a href={pageNumUrl(data.page - 1)} class="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold transition hover:border-brand">{t().katalog.prev}</a>
					{:else}
						<span aria-disabled="true" class="pointer-events-none rounded-full border border-line px-5 py-2.5 text-sm font-bold opacity-40">{t().katalog.prev}</span>
					{/if}
					{#each pageItems as item}
						{#if item === '…'}
							<span class="px-1 text-sm text-muted" aria-hidden="true">…</span>
						{:else if item === data.page}
							<span aria-current="page" class="rounded-full border border-brand bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink">{item}</span>
						{:else}
							<a href={pageNumUrl(item)} aria-label="{t().katalog.page} {item}" class="hidden rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-bold transition hover:border-brand sm:inline-block">{item}</a>
						{/if}
					{/each}
					<span class="px-2 text-sm text-muted sm:hidden">{data.page} / {totalPages}</span>
					{#if data.page * data.limit < data.total}
						<a href={pageNumUrl(data.page + 1)} class="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold transition hover:border-brand">{t().katalog.next}</a>
					{:else}
						<span aria-disabled="true" class="pointer-events-none rounded-full border border-line px-5 py-2.5 text-sm font-bold opacity-40">{t().katalog.next}</span>
					{/if}
				</nav>
			{/if}
		</div>
	</div>
</section>
