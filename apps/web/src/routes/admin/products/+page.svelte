<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type ProductRow = {
		id: number; slug: string; sku: string | null; name: string; description: string | null;
		price: number; categoryId: number | null; status: string;
		image?: { id: number; url: string } | null;
	};
	type CatRow = { id: number; slug: string; name: string };

	let products = $state<ProductRow[]>([]);
	let cats = $state<CatRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let q = $state('');
	let fCat = $state('');
	let fStatus = $state('all');
	let confirming: string | null = $state(null);

	const canView = $derived(adminSession.can('products.write'));

	async function load() {
		loading = true;
		error = '';
		try {
			const [pRes, cRes] = await Promise.all([
				adminSession.api('/api/products?limit=50&status=all'),
				adminSession.api('/api/categories')
			]);
			if (!pRes.ok || !cRes.ok) throw new Error('load');
			products = ((await pRes.json()) as { products: ProductRow[] }).products;
			cats = (await cRes.json()) as CatRow[];
		} catch {
			error = t().admin.loadFail;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		if (canView) await load();
		else loading = false;
	});

	const filtered = $derived(
		products.filter((p) => {
			if (fCat !== '' && p.categoryId !== Number(fCat)) return false;
			if (fStatus !== 'all' && p.status !== fStatus) return false;
			const needle = q.trim().toLowerCase();
			if (!needle) return true;
			return p.name.toLowerCase().includes(needle) || (p.sku ?? '').toLowerCase().includes(needle);
		})
	);

	function apiError(json: unknown): string {
		const e = (json as { error?: string }).error ?? '';
		if (e.includes('already exists')) return t().admin.duplicate;
		if (e.includes('unknown')) return t().admin.unknownRef;
		return e || t().admin.loadFail;
	}

	async function remove(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/products/${slug}`, { method: 'DELETE' });
			if (!res.ok) {
				error = apiError(await res.json());
				confirming = null;
				return;
			}
			notice = t().admin.saved;
			confirming = null;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.productsTitle} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.productsTitle}</h1>
		<button type="button" onclick={() => goto(localize('/admin/products/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.newItem}
		</button>
	</div>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		<div class="mt-6 flex flex-wrap items-center gap-2">
			<input bind:value={q} placeholder={t().admin.searchNameSku} class="min-w-0 w-full rounded-full border px-4 py-2 text-sm sm:w-auto sm:flex-1 sm:max-w-xs" />
			<select bind:value={fCat} aria-label={t().admin.categoryCol} class="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-ink">
				<option value="">{t().admin.allCategories}</option>
				{#each cats as c}<option value={String(c.id)}>{c.name}</option>{/each}
			</select>
			<select bind:value={fStatus} aria-label={t().admin.statusCol} class="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-ink">
				<option value="all">{t().admin.statusAll}</option>
				<option value="active">{t().admin.active}</option>
				<option value="draft">{t().admin.draft}</option>
			</select>
		</div>

		{#if loading}
			<p class="mt-6 text-muted">…</p>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
				<table class="w-full min-w-[640px] text-left text-sm">
					<thead>
						<tr class="border-b border-line text-xs uppercase tracking-wider text-muted">
							<th class="px-4 py-3">{t().admin.productName}</th>
							<th class="px-4 py-3">{t().admin.priceIdr}</th>
							<th class="px-4 py-3">{t().admin.statusCol}</th>
							<th class="px-4 py-3">{t().admin.actions}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-line">
						{#each filtered as p}
							<tr>
								<td class="px-4 py-2.5">
									<span class="flex items-center gap-3">
										{#if p.image?.url}
											<img src={p.image.url} alt="" class="h-10 w-14 shrink-0 rounded-lg border border-line object-cover" loading="lazy" />
										{:else}
											<span class="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-line bg-accent-soft text-[10px] font-bold text-accent-strong" aria-hidden="true">—</span>
										{/if}
										<span class="min-w-0">
											<span class="block truncate font-semibold">{p.name}</span>
											<span class="block truncate font-mono text-xs font-normal text-muted">SKU: {p.sku ?? '—'}</span>
											<span class="block truncate text-xs font-normal text-muted">{t().admin.categoryCol}: {cats.find((c) => c.id === p.categoryId)?.name ?? '—'}</span>
										</span>
									</span>
								</td>
								<td class="px-4 py-2.5 font-bold">{p.price.toLocaleString('id-ID')}</td>
								<td class="px-4 py-2.5">
									<span class="rounded-full px-2.5 py-0.5 text-xs font-bold {p.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}">
										{p.status === 'active' ? t().admin.active : t().admin.draft}
									</span>
								</td>
								<td class="px-4 py-2.5">
									<div class="flex gap-1.5">
										<a href={localize(`/admin/products/${p.slug}/edit`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editItem}</a>
										{#if confirming === p.slug}
											<button type="button" onclick={() => remove(p.slug)} class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{t().admin.yesDelete}</button>
											<button type="button" onclick={() => (confirming = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>
										{:else}
											<button type="button" onclick={() => (confirming = p.slug)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.delete}</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="mt-3 text-sm text-muted">{filtered.length} / {products.length}</p>
		{/if}
	{/if}
</section>
