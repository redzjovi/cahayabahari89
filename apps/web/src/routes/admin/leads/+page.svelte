<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PAGE_SIZES, readIntParam, readStringParam, buildSearch, gotoSamePage } from '$lib/admin-pagination';

	type LeadRow = {
		id: number; name: string; email: string; company: string | null;
		volume: string | null; message: string; createdAt?: string | null;
	};

	type SortKey = 'name' | 'email' | 'created';
	const SORT_API: Record<SortKey, { asc: string; desc: string; default: 'asc' | 'desc' }> = {
		name: { asc: 'name_asc', desc: 'name_desc', default: 'asc' },
		email: { asc: 'email_asc', desc: 'email_desc', default: 'asc' },
		created: { asc: 'created_asc', desc: 'created_desc', default: 'desc' }
	};
	const SORT_FROM_API: Record<string, { key: SortKey; dir: 'asc' | 'desc' }> = {};
	for (const [k, v] of Object.entries(SORT_API)) {
		SORT_FROM_API[v.asc] = { key: k as SortKey, dir: 'asc' };
		SORT_FROM_API[v.desc] = { key: k as SortKey, dir: 'desc' };
	}

	let items = $state<LeadRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let fName = $state('');
	let fEmail = $state('');
	let sortKey = $state<SortKey>('created');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let currentPage = $state(1);
	let pageSize = $state<10 | 25 | 50 | 100>(10);
	let total = $state(0);
	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));

	const canView = $derived(adminSession.can('leads.read'));

	function searchParams() {
		return buildSearch({
			page: currentPage, limit: pageSize,
			sort: SORT_API[sortKey][sortDir],
			name: fName, email: fEmail
		});
	}

	async function load() {
		loading = true;
		error = '';
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('limit', String(pageSize));
		const m = SORT_API[sortKey];
		params.set('sort', sortDir === 'asc' ? m.asc : m.desc);
		if (fName.trim()) params.set('name', fName.trim());
		if (fEmail.trim()) params.set('email', fEmail.trim());
		try {
			const res = await adminSession.api(`/api/admin/leads?${params.toString()}`);
			if (!res.ok) throw new Error('load');
			const data = (await res.json()) as { data: LeadRow[]; meta: { total: number } };
			items = data.data;
			total = data.meta.total;
			if (items.length === 0 && currentPage > 1) {
				currentPage = 1;
				await gotoSamePage(buildSearch({
					page: 1, limit: pageSize,
					sort: SORT_API[sortKey][sortDir],
					name: fName, email: fEmail
				}));
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
		const nameParam = readStringParam('name');
		if (nameParam) fName = nameParam;
		const emailParam = readStringParam('email');
		if (emailParam) fEmail = emailParam;
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

	async function applyFilters() {
		currentPage = 1;
		await gotoSamePage(buildSearch({
			page: 1, limit: pageSize,
			sort: SORT_API[sortKey][sortDir],
			name: fName, email: fEmail
		}));
		await load();
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = SORT_API[key].default;
		}
		currentPage = 1;
		gotoSamePage(searchParams());
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

	function formatDateTime(value: string | null | undefined): string {
		if (!value) return '—';
		const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return value;
		return d.toLocaleString(locale.current === 'id' ? 'id-ID' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function excerpt(message: string): string {
		const oneLine = message.replace(/\s+/g, ' ').trim();
		return oneLine.length > 80 ? oneLine.slice(0, 80) + '…' : oneLine;
	}

	async function setPage(p: number) {
		const next = Math.max(1, Math.min(pageCount, p));
		if (next === currentPage) return;
		currentPage = next;
		await gotoSamePage(buildSearch({
			page: currentPage, limit: pageSize,
			sort: SORT_API[sortKey][sortDir],
			name: fName, email: fEmail
		}));
		await load();
	}

	async function setPageSize(s: number) {
		pageSize = (s as 10 | 25 | 50 | 100);
		currentPage = 1;
		await gotoSamePage(buildSearch({
			page: 1, limit: pageSize,
			sort: SORT_API[sortKey][sortDir],
			name: fName, email: fEmail
		}));
		await load();
	}

	let fDebounce: ReturnType<typeof setTimeout> | null = null;
	function onFilterInput() {
		if (fDebounce) clearTimeout(fDebounce);
		fDebounce = setTimeout(() => void applyFilters(), 300);
	}
</script>

<svelte:head><title>{t().admin.leads} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<h1 class="font-display text-3xl font-bold">{t().admin.leads}</h1>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		<div class="mt-6 flex flex-wrap items-center gap-2">
			<input bind:value={fName} oninput={onFilterInput} placeholder={t().admin.searchName} class="min-w-0 w-full rounded-full border px-4 py-2 text-sm sm:w-auto sm:flex-1 sm:max-w-xs" />
			<input bind:value={fEmail} oninput={onFilterInput} placeholder={t().admin.searchEmail} class="min-w-0 w-full rounded-full border px-4 py-2 text-sm sm:w-auto sm:flex-1 sm:max-w-xs" />
		</div>

		{#if loading}
			<p class="mt-6 text-muted">…</p>
		{:else if items.length === 0}
			<p class="mt-6 rounded-card border border-dashed border-line p-6 text-center text-muted">{t().admin.noResults}</p>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
			<table class="w-full min-w-[720px] text-left text-sm">
				<thead>
					<tr class="border-b border-line text-xs uppercase tracking-wider text-muted">
						<th class="px-4 py-3" aria-sort={ariaSort('created')}>
							<button
								type="button"
								onclick={() => toggleSort('created')}
								aria-label={sortLabel('created', t().admin.createdAt)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'created' ? 'text-ink' : ''}"
							>
								<span>{t().admin.createdAt}</span>
								<span class="text-[10px] {sortKey === 'created' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('created')}</span>
							</button>
						</th>
						<th class="px-4 py-3" aria-sort={ariaSort('name')}>
							<button
								type="button"
								onclick={() => toggleSort('name')}
								aria-label={sortLabel('name', t().admin.name)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'name' ? 'text-ink' : ''}"
							>
								<span>{t().admin.name}</span>
								<span class="text-[10px] {sortKey === 'name' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('name')}</span>
							</button>
						</th>
						<th class="px-4 py-3" aria-sort={ariaSort('email')}>
							<button
								type="button"
								onclick={() => toggleSort('email')}
								aria-label={sortLabel('email', t().admin.email)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'email' ? 'text-ink' : ''}"
							>
								<span>{t().admin.email}</span>
								<span class="text-[10px] {sortKey === 'email' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('email')}</span>
							</button>
						</th>
						<th class="px-4 py-3">{t().admin.companyCol}</th>
						<th class="px-4 py-3">{t().admin.messageCol}</th>
						<th class="px-4 py-3">{t().admin.actions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each items as lead}
						<tr>
							<td class="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{formatDateTime(lead.createdAt)}</td>
							<td class="px-4 py-2.5 font-semibold">{lead.name}</td>
							<td class="px-4 py-2.5">{lead.email}</td>
							<td class="px-4 py-2.5">{lead.company ?? '—'}</td>
							<td class="max-w-xs truncate px-4 py-2.5 text-muted">{excerpt(lead.message)}</td>
							<td class="px-4 py-2.5">
								<a href={localize(`/admin/leads/${lead.id}`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.view}</a>
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
