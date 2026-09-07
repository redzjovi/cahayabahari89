<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type CatRow = { id: number; slug: string; name: string };
	type CatWithCount = CatRow & { products: number };

	let cats = $state<CatWithCount[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let confirming: string | null = $state(null);
	type SortKey = 'slug' | 'name';
	let sortKey = $state<SortKey>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');

	const canView = $derived(adminSession.can('categories.write'));

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await adminSession.api('/api/categories');
			if (!res.ok) throw new Error('load');
			const rows = (await res.json()) as CatRow[];
			cats = await Promise.all(
				rows.map(async (c) => {
					try {
						const r = await adminSession.api(`/api/products?cat=${encodeURIComponent(c.slug)}&limit=1`);
						const d = (await r.json()) as { total: number };
						return { ...c, products: d.total ?? 0 };
					} catch {
						return { ...c, products: 0 };
					}
				})
			);
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

	const sorted = $derived.by(() => {
		const arr = [...cats];
		const dir = sortDir === 'asc' ? 1 : -1;
		arr.sort((a, b) => a[sortKey].localeCompare(b[sortKey]) * dir);
		return arr;
	});

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
		if (sortKey !== key) return 'none';
		return sortDir === 'asc' ? 'ascending' : 'descending';
	}

	function sortLabel(key: SortKey, col: string): string {
		const raw = sortKey === key
			? (sortDir === 'asc' ? t().admin.sortedAsc : t().admin.sortedDesc)
			: t().admin.sortBy;
		return raw.replace('{col}', col);
	}

	function sortIndicator(key: SortKey): string {
		if (sortKey !== key) return '↕';
		return sortDir === 'asc' ? '▲' : '▼';
	}

	function apiError(json: unknown): string {
		const e = (json as { error?: string }).error ?? '';
		if (e.includes('used by products')) return t().admin.categoryDeleteBlocked;
		return e || t().admin.loadFail;
	}

	async function remove(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/categories/${slug}`, { method: 'DELETE' });
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

<svelte:head><title>{t().admin.categoriesTitle} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.categoriesTitle}</h1>
		<button type="button" onclick={() => goto(localize('/admin/categories/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.newItem}
		</button>
	</div>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else}
		<div class="mt-6 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
			<table class="w-full min-w-[520px] text-left text-sm">
				<thead>
					<tr class="border-b border-line text-xs uppercase tracking-wider text-muted">
						<th class="px-4 py-3" aria-sort={ariaSort('slug')}>
							<button
								type="button"
								onclick={() => toggleSort('slug')}
								aria-label={sortLabel('slug', t().admin.roleSlug)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'slug' ? 'text-ink' : ''}"
							>
								<span>{t().admin.roleSlug}</span>
								<span class="text-[10px] {sortKey === 'slug' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('slug')}</span>
							</button>
						</th>
						<th class="px-4 py-3" aria-sort={ariaSort('name')}>
							<button
								type="button"
								onclick={() => toggleSort('name')}
								aria-label={sortLabel('name', t().admin.categoryName)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'name' ? 'text-ink' : ''}"
							>
								<span>{t().admin.categoryName}</span>
								<span class="text-[10px] {sortKey === 'name' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('name')}</span>
							</button>
						</th>
						<th class="px-4 py-3">{t().admin.usedBy}</th>
						<th class="px-4 py-3">{t().admin.actions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each sorted as c}
						<tr>
							<td class="px-4 py-2.5 font-mono text-[13px] font-semibold">{c.slug}</td>
							<td class="px-4 py-2.5">{c.name}</td>
							<td class="px-4 py-2.5">{c.products}</td>
							<td class="px-4 py-2.5">
								<div class="flex gap-1.5">
									<a href={localize(`/admin/categories/${c.slug}/edit`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editItem}</a>
									{#if confirming === c.slug}
										<button type="button" onclick={() => remove(c.slug)} class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{t().admin.yesDelete}</button>
										<button type="button" onclick={() => (confirming = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>
									{:else}
										<button type="button" onclick={() => (confirming = c.slug)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.delete}</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
