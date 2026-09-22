<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PAGE_SIZES, readIntParam, readStringParam, buildSearch, gotoSamePage } from '$lib/admin-pagination';
	import { createQuery, keepPreviousData, useQueryClient } from '@tanstack/svelte-query';
	import { fetchJson } from '$lib/queries/fetcher';
	import { qk } from '$lib/queries/keys';

	type UserRow = { id: number; email: string; name: string; status: string; roles: string[]; createdAt?: string | null };

	const USERS_STATUS_VALUES = ['active', 'suspended'] as const;

	type SortKey = 'email' | 'name' | 'status' | 'created';
	const SORT_API: Record<SortKey, { asc: string; desc: string; default: 'asc' | 'desc' }> = {
		email: { asc: 'email_asc', desc: 'email_desc', default: 'asc' },
		name: { asc: 'name_asc', desc: 'name_desc', default: 'asc' },
		status: { asc: 'status_asc', desc: 'status_desc', default: 'asc' },
		created: { asc: 'created_asc', desc: 'created_desc', default: 'desc' }
	};
	const SORT_FROM_API: Record<string, { key: SortKey; dir: 'asc' | 'desc' }> = {};
	for (const [k, v] of Object.entries(SORT_API)) {
		SORT_FROM_API[v.asc] = { key: k as SortKey, dir: 'asc' };
		SORT_FROM_API[v.desc] = { key: k as SortKey, dir: 'desc' };
	}

	let fEmail = $state('');
	let fName = $state('');
	let fStatus = $state<'all' | 'active' | 'suspended'>('all');
	let sortKey = $state<SortKey>('created');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let currentPage = $state(1);
	let pageSize = $state<10 | 25 | 50 | 100>(10);
	let authed = $state(false);

	const canView = $derived(adminSession.can('users.manage'));
	const queryClient = useQueryClient();

	const params = $derived({
		page: currentPage,
		limit: pageSize,
		sort: SORT_API[sortKey][sortDir],
		email: fEmail.trim(),
		name: fName.trim(),
		status: fStatus
	});

	const usersQuery = createQuery(() => ({
		queryKey: qk.users(params),
		enabled: authed && canView,
		placeholderData: keepPreviousData,
		staleTime: 30_000,
		queryFn: async ({ signal }) => {
			const p = new URLSearchParams();
			p.set('page', String(params.page));
			p.set('limit', String(params.limit));
			p.set('sort', params.sort as string);
			if (params.email) p.set('email', params.email as string);
			if (params.name) p.set('name', params.name as string);
			if (params.status !== 'all') p.set('status', params.status as string);
			return fetchJson<{ data: UserRow[]; meta: { total: number } }>(`/api/admin/users?${p.toString()}`, { signal });
		}
	}));

	const items = $derived(usersQuery.data?.data ?? []);
	const total = $derived(usersQuery.data?.meta.total ?? 0);
	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const loading = $derived(usersQuery.isPending);
	const isFetching = $derived(usersQuery.isFetching);
	const queryError = $derived(usersQuery.error ? t().admin.loadFail : '');
	const displayError = $derived(queryError);

	$effect(() => {
		if (!usersQuery.isPending && items.length === 0 && currentPage > 1 && total > 0) {
			currentPage = 1;
			void gotoSamePage(buildSearch({ page: 1, limit: pageSize, sort: SORT_API[sortKey][sortDir], email: fEmail, name: fName, status: fStatus }));
		}
	});

	$effect(() => {
		if (currentPage < pageCount && authed && canView) {
			const next = { ...params, page: currentPage + 1 };
			queryClient.prefetchQuery({
				queryKey: qk.users(next),
				staleTime: 30_000,
				queryFn: async ({ signal }) => {
					const p = new URLSearchParams();
					p.set('page', String(next.page));
					p.set('limit', String(next.limit));
					p.set('sort', next.sort as string);
					if (next.email) p.set('email', next.email as string);
					if (next.name) p.set('name', next.name as string);
					if (next.status !== 'all') p.set('status', next.status as string);
					return fetchJson<{ data: UserRow[]; meta: { total: number } }>(`/api/admin/users?${p.toString()}`, { signal });
				}
			});
		}
	});

	onMount(async () => {
		adminSession.init();
		if (adminSession.user) authed = true;
		else authed = await adminSession.refresh();
		if (!authed) return;
		const emailParam = readStringParam('email');
		if (emailParam) fEmail = emailParam;
		const nameParam = readStringParam('name');
		if (nameParam) fName = nameParam;
		const statusParam = readStringParam('status', [...USERS_STATUS_VALUES]);
		fStatus = (statusParam as 'active' | 'suspended') ?? 'all';
		const sortParam = readStringParam('sort');
		const mapped = sortParam ? SORT_FROM_API[sortParam] : null;
		if (mapped) {
			sortKey = mapped.key;
			sortDir = mapped.dir;
		}
		currentPage = readIntParam('page', 1);
		pageSize = (readIntParam('limit', 10, [...PAGE_SIZES]) as 10 | 25 | 50 | 100);
	});

	async function applyFilters() {
		currentPage = 1;
		await gotoSamePage(buildSearch({ page: 1, limit: pageSize, sort: SORT_API[sortKey][sortDir], email: fEmail, name: fName, status: fStatus }));
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = SORT_API[key].default;
		}
		currentPage = 1;
		gotoSamePage(buildSearch({ page: 1, limit: pageSize, sort: SORT_API[sortKey][sortDir], email: fEmail, name: fName, status: fStatus }));
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

	function formatDateTime(value: string | null): string {
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

	async function setPage(p: number) {
		const next = Math.max(1, Math.min(pageCount, p));
		if (next === currentPage) return;
		currentPage = next;
		await gotoSamePage(buildSearch({ page: currentPage, limit: pageSize, sort: SORT_API[sortKey][sortDir], email: fEmail, name: fName, status: fStatus }));
	}

	async function setPageSize(s: number) {
		pageSize = (s as 10 | 25 | 50 | 100);
		currentPage = 1;
		await gotoSamePage(buildSearch({ page: 1, limit: pageSize, sort: SORT_API[sortKey][sortDir], email: fEmail, name: fName, status: fStatus }));
	}

	let fDebounce: ReturnType<typeof setTimeout> | null = null;
	function onFilterInput() {
		if (fDebounce) clearTimeout(fDebounce);
		fDebounce = setTimeout(() => void applyFilters(), 300);
	}
</script>

<svelte:head><title>{t().admin.users} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.users}</h1>
		<button type="button" onclick={() => goto(localize('/admin/users/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.newItem}
		</button>
	</div>

	{#if displayError}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{displayError}</p>{/if}
	{#if isFetching && !loading}<p class="mt-2 text-xs text-muted">Updating…</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		<div class="mt-6 flex flex-wrap items-center gap-2">
			<input bind:value={fEmail} oninput={onFilterInput} placeholder={t().admin.searchEmail} class="min-w-0 w-full rounded-full border px-4 py-2 text-sm sm:w-auto sm:flex-1 sm:max-w-xs" />
			<input bind:value={fName} oninput={onFilterInput} placeholder={t().admin.searchName} class="min-w-0 w-full rounded-full border px-4 py-2 text-sm sm:w-auto sm:flex-1 sm:max-w-xs" />
			<select bind:value={fStatus} onchange={() => applyFilters()} aria-label={t().admin.status} class="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-ink">
				<option value="all">{t().admin.statusAll}</option>
				<option value="active">{t().admin.active}</option>
				<option value="suspended">{t().admin.suspended}</option>
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
						<th class="px-4 py-3">{t().admin.editRoles}</th>
						<th class="px-4 py-3" aria-sort={ariaSort('status')}>
							<button
								type="button"
								onclick={() => toggleSort('status')}
								aria-label={sortLabel('status', t().admin.status)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'status' ? 'text-ink' : ''}"
							>
								<span>{t().admin.status}</span>
								<span class="text-[10px] {sortKey === 'status' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('status')}</span>
							</button>
						</th>
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
						<th class="px-4 py-3">{t().admin.actions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each items as u}
						<tr>
							<td class="px-4 py-2.5 font-semibold">{u.email}</td>
							<td class="px-4 py-2.5">{u.name}</td>
							<td class="px-4 py-2.5">
								<div class="flex flex-wrap gap-1.5">
									{#each u.roles as r}<span class="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong">{r}</span>{:else}<span class="text-xs text-muted">—</span>{/each}
								</div>
							</td>
							<td class="px-4 py-2.5">
								<span class="rounded-full px-2.5 py-0.5 text-xs font-bold {u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}">
									{u.status === 'active' ? t().admin.active : t().admin.suspended}
								</span>
							</td>
							<td class="px-4 py-2.5 text-xs text-muted">{formatDateTime(u.createdAt ?? null)}</td>
							<td class="px-4 py-2.5">
								<a href={localize(`/admin/users/${u.id}/edit`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editItem}</a>
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
