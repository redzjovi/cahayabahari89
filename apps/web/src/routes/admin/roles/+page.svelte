<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PAGE_SIZES, readIntParam, buildSearch, gotoSamePage } from '$lib/admin-pagination';

	type RoleRow = { id: number; slug: string; name: string; permissions: string[]; users: number };

	let items = $state<RoleRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let confirmingRole: string | null = $state(null);
	let currentPage = $state(1);
	let pageSize = $state<10 | 25 | 50 | 100>(10);
	let total = $state(0);
	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));

	const canView = $derived(adminSession.can('roles.manage'));

	async function load() {
		loading = true;
		error = '';
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('limit', String(pageSize));
		try {
			const res = await adminSession.api(`/api/admin/roles?${params.toString()}`);
			if (!res.ok) throw new Error('load');
			const data = (await res.json()) as { data: RoleRow[]; meta: { total: number } };
			items = data.data;
			total = data.meta.total;
			if (items.length === 0 && currentPage > 1) {
				currentPage = 1;
				await gotoSamePage(buildSearch({ page: 1, limit: pageSize }));
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
		currentPage = readIntParam('page', 1);
		pageSize = (readIntParam('limit', 10, [...PAGE_SIZES]) as 10 | 25 | 50 | 100);
		await load();
	});

	function apiError(json: unknown): string {
		const j = json as { message?: string; errors?: Record<string, string | string[]> };
		const e = j.message ?? Object.values(j.errors ?? {}).flat().join(' ') ?? '';
		if (e.includes('assigned')) return t().admin.roleDeleteBlocked;
		return e || t().admin.loadFail;
	}

	async function deleteRole(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/roles/${slug}`, { method: 'DELETE' });
			if (!res.ok) {
				error = apiError(await res.json());
				confirmingRole = null;
				return;
			}
			notice = t().admin.saved;
			confirmingRole = null;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function setPage(p: number) {
		const next = Math.max(1, Math.min(pageCount, p));
		if (next === currentPage) return;
		currentPage = next;
		await gotoSamePage(buildSearch({ page: currentPage, limit: pageSize }));
		await load();
	}

	async function setPageSize(s: number) {
		pageSize = (s as 10 | 25 | 50 | 100);
		currentPage = 1;
		await gotoSamePage(buildSearch({ page: 1, limit: pageSize }));
		await load();
	}
</script>

<svelte:head><title>{t().admin.roles} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.roles}</h1>
		<button type="button" onclick={() => goto(localize('/admin/roles/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.newItem}
		</button>
	</div>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else if items.length === 0}
		<p class="mt-6 rounded-card border border-dashed border-line p-6 text-center text-muted">{t().admin.noResults}</p>
	{:else}
		<div class="mt-6 grid gap-4 lg:grid-cols-2">
			{#each items as r}
				<div class="rounded-card border border-line bg-surface p-6 shadow-card">
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent-strong">{r.slug}</span>
						<span class="font-semibold">{r.name}</span>
						<span class="ml-auto text-xs text-muted">{r.users} × {t().admin.users.toLowerCase()}</span>
					</div>
					<div class="mt-3 flex flex-wrap gap-2">
						{#each r.permissions as p}<span class="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-muted">{p}</span>{/each}
					</div>
					<div class="mt-4 flex flex-wrap gap-1.5">
						<a href={localize(`/admin/roles/${r.slug}/edit`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editItem}</a>
						{#if confirmingRole === r.slug}
							<button type="button" onclick={() => deleteRole(r.slug)} class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{t().admin.yesDelete}</button>
							<button type="button" onclick={() => (confirmingRole = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>
						{:else}
							<button type="button" onclick={() => (confirmingRole = r.slug)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.delete}</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
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
</section>
