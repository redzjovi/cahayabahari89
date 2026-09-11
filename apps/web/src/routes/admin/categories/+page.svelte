<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PAGE_SIZES, readIntParam, readStringParam, buildSearch } from '$lib/admin-pagination';

	type CatRow = { id: number; slug: string; name: string; status: string; products: number };

	let items = $state<CatRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let confirming: string | null = $state(null);
	let q = $state('');
	let fStatus = $state('all');

	type SortKey = 'slug' | 'name' | 'products' | 'status';
	const SORT_API: Record<SortKey, { asc: string; desc: string; default: 'asc' | 'desc' }> = {
		slug: { asc: 'slug_asc', desc: 'slug_desc', default: 'asc' },
		name: { asc: 'name_asc', desc: 'name_desc', default: 'asc' },
		products: { asc: 'products_asc', desc: 'products_desc', default: 'desc' },
		status: { asc: 'status_asc', desc: 'status_desc', default: 'asc' }
	};
	const SORT_FROM_API: Record<string, { key: SortKey; dir: 'asc' | 'desc' }> = {};
	for (const [k, v] of Object.entries(SORT_API)) {
		SORT_FROM_API[v.asc] = { key: k as SortKey, dir: 'asc' };
		SORT_FROM_API[v.desc] = { key: k as SortKey, dir: 'desc' };
	}
	let sortKey = $state<SortKey>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');
	let currentPage = $state(1);
	let pageSize = $state<10 | 25 | 50 | 100>(10);
	let total = $state(0);
	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));

	const canView = $derived(adminSession.can('categories.write'));

	function currentSortApi(): string {
		const m = SORT_API[sortKey];
		return sortDir === 'asc' ? m.asc : m.desc;
	}

	function currentSearchHref(): string {
		return buildSearch({
			page: currentPage,
			limit: pageSize,
			sort: currentSortApi(),
			q: q.trim(),
			status: fStatus
		});
	}

	/** Write filter state to the URL without SvelteKit navigation: goto() runs the
	 * full navigation pipeline (focus restore, scroll handling) which fights the
	 * native <select> dropdown on change. Bare replaceState keeps URLs shareable. */
	function syncUrl(href: string) {
		if (typeof history !== 'undefined') history.replaceState(history.state, '', href);
	}

	async function load() {
		loading = true;
		error = '';
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('limit', String(pageSize));
		params.set('sort', currentSortApi());
		if (q.trim()) params.set('q', q.trim());
		if (fStatus !== 'all') params.set('status', fStatus);
		try {
			const res = await adminSession.api(`/api/admin/categories?${params.toString()}`);
			if (!res.ok) throw new Error('load');
			const data = (await res.json()) as { data: CatRow[]; meta: { total: number } };
			items = data.data;
			total = data.meta.total;
			if (items.length === 0 && currentPage > 1) {
				currentPage = 1;
				syncUrl(buildSearch({ page: 1, limit: pageSize, sort: currentSortApi(), q: q.trim(), status: fStatus }));
				await load();
				return;
			}
		} catch {
			error = t().admin.loadFail;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		adminSession.init();
		if (!(await adminSession.refresh())) return;
		const qParam = readStringParam('q');
		if (qParam) q = qParam;
		const statusParam = readStringParam('status', ['active', 'draft']);
		if (statusParam) fStatus = statusParam;
		const sortParam = readStringParam('sort');
		const mapped = sortParam ? SORT_FROM_API[sortParam] : null;
		if (mapped) {
			sortKey = mapped.key;
			sortDir = mapped.dir;
		}
		currentPage = readIntParam('page', 1);
		pageSize = (readIntParam('limit', 10, [...PAGE_SIZES]) as 10 | 25 | 50 | 100);
		await load();
	});

	function apiError(json: unknown): string {
		const j = json as { message?: string; errors?: Record<string, string | string[]> };
		const e = j.message ?? Object.values(j.errors ?? {}).flat().join(' ') ?? '';
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

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = SORT_API[key].default;
		}
		currentPage = 1;
		syncUrl(currentSearchHref());
		void load();
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

	async function setPage(p: number) {
		const next = Math.max(1, Math.min(pageCount, p));
		if (next === currentPage) return;
		currentPage = next;
		syncUrl(currentSearchHref());
		await load();
	}

	async function setPageSize(s: number) {
		pageSize = (s as 10 | 25 | 50 | 100);
		currentPage = 1;
		syncUrl(currentSearchHref());
		await load();
	}

	async function applyFilters() {
		currentPage = 1;
		syncUrl(currentSearchHref());
		await load();
	}

	let qDebounce: ReturnType<typeof setTimeout> | null = null;
	function onSearchInput() {
		if (qDebounce) clearTimeout(qDebounce);
		qDebounce = setTimeout(() => void applyFilters(), 300);
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
	{:else}
		<div class="mt-6 flex flex-wrap items-center gap-2">
			<input bind:value={q} oninput={onSearchInput} placeholder={t().admin.searchName} class="min-w-0 w-full rounded-full border px-4 py-2 text-sm sm:w-auto sm:flex-1 sm:max-w-xs" />
			<select bind:value={fStatus} onchange={() => applyFilters()} aria-label={t().admin.statusCol} class="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-ink">
				<option value="all">{t().admin.statusAll}</option>
				<option value="active">{t().admin.active}</option>
				<option value="draft">{t().admin.draft}</option>
			</select>
		</div>

		{#if loading}
			<p class="mt-6 text-muted">…</p>
		{:else if items.length === 0}
			<p class="mt-6 rounded-card border border-dashed border-line p-6 text-center text-muted">{t().admin.noResults}</p>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
				<table class="w-full min-w-[640px] text-left text-sm">
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
							<th class="px-4 py-3" aria-sort={ariaSort('products')}>
								<button
									type="button"
									onclick={() => toggleSort('products')}
									aria-label={sortLabel('products', t().admin.usedBy)}
									class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'products' ? 'text-ink' : ''}"
								>
									<span>{t().admin.usedBy}</span>
									<span class="text-[10px] {sortKey === 'products' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('products')}</span>
								</button>
							</th>
							<th class="px-4 py-3" aria-sort={ariaSort('status')}>
								<button
									type="button"
									onclick={() => toggleSort('status')}
									aria-label={sortLabel('status', t().admin.statusCol)}
									class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'status' ? 'text-ink' : ''}"
								>
									<span>{t().admin.statusCol}</span>
									<span class="text-[10px] {sortKey === 'status' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('status')}</span>
								</button>
							</th>
							<th class="px-4 py-3">{t().admin.actions}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-line">
						{#each items as c}
							<tr>
								<td class="px-4 py-2.5 font-mono text-[13px] font-semibold">{c.slug}</td>
								<td class="px-4 py-2.5">{c.name}</td>
								<td class="px-4 py-2.5 font-bold">{c.products}</td>
								<td class="px-4 py-2.5">
									<span class="rounded-full px-2.5 py-0.5 text-xs font-bold {c.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}">
										{c.status === 'active' ? t().admin.active : t().admin.draft}
									</span>
								</td>
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
			<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
				<span>{items.length} / {total}</span>
				<span class="ml-auto flex items-center gap-2">
					<label class="flex items-center gap-1.5">
						<span>{t().admin.perPage}</span>
						<select value={pageSize} onchange={(e) => setPageSize(Number((e.currentTarget as HTMLSelectElement).value))} class="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink">
							{#each PAGE_SIZES as s}<option value={s}>{s}</option>{/each}
						</select>
					</label>
					<button type="button" onclick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} class="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">{t().admin.prev}</button>
					<span>{t().admin.page} {currentPage} {t().admin.of} {pageCount}</span>
					<button type="button" onclick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount} class="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">{t().admin.next}</button>
				</span>
			</div>
		{/if}
	{/if}
</section>
