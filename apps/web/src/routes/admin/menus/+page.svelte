<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PAGE_SIZES, readIntParam, readStringParam, buildSearch, gotoSamePage } from '$lib/admin-pagination';

	type MenuRow = {
		id: number; location: string; labelEn: string; labelId: string;
		href: string; sort: number; visible: number;
	};

	let items = $state<MenuRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let confirming: number | null = $state(null);
	let fLoc = $state('all');

	let currentPage = $state(1);
	let pageSize = $state<10 | 25 | 50 | 100>(10);
	let total = $state(0);
	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));

	const canView = $derived(adminSession.can('content.manage'));

	const locLabel = (l: string) =>
		l === 'header' ? t().admin.headerLoc : l === 'social' ? t().admin.socialLoc : l;

	async function load() {
		loading = true;
		error = '';
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('limit', String(pageSize));
		try {
			const res = await adminSession.api(`/api/admin/menus?${params.toString()}`);
			if (!res.ok) throw new Error('load');
			const data = (await res.json()) as { data: MenuRow[]; meta: { total: number } };
			const all = data.data;
			items = fLoc === 'all' ? all : all.filter((m) => m.location === fLoc);
			total = fLoc === 'all' ? data.meta.total : items.length;
			if (items.length === 0 && currentPage > 1) {
				currentPage = 1;
				await gotoSamePage(buildSearch({ page: 1, limit: pageSize, loc: fLoc }));
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
		const locParam = readStringParam('loc', ['all', 'header', 'social']);
		if (locParam) fLoc = locParam;
		currentPage = readIntParam('page', 1);
		pageSize = (readIntParam('limit', 10, [...PAGE_SIZES]) as 10 | 25 | 50 | 100);
		await load();
	});

	async function applyLoc(loc: string) {
		fLoc = loc;
		currentPage = 1;
		await gotoSamePage(buildSearch({ page: 1, limit: pageSize, loc }));
		await load();
	}

	async function toggleVisible(m: MenuRow) {
		error = '';
		try {
			const res = await adminSession.api(`/api/admin/menus/${m.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ visible: m.visible === 1 ? false : true })
			});
			if (!res.ok) throw new Error('save');
			notice = t().admin.saved;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function remove(id: number) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/menus/${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('delete');
			notice = t().admin.saved;
			confirming = null;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function setPage(p: number) {
		const next = Math.max(1, Math.min(pageCount, p));
		if (next === currentPage) return;
		currentPage = next;
		await gotoSamePage(buildSearch({ page: next, limit: pageSize, loc: fLoc }));
		await load();
	}

	async function setPageSize(s: number) {
		pageSize = (s as 10 | 25 | 50 | 100);
		currentPage = 1;
		await gotoSamePage(buildSearch({ page: 1, limit: pageSize, loc: fLoc }));
		await load();
	}
</script>

<svelte:head><title>{t().admin.menusTitle} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.menusTitle}</h1>
		<button type="button" onclick={() => goto(localize('/admin/menus/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.newItem}
		</button>
	</div>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		<div class="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label={t().admin.locationCol}>
			{#each [['all', t().admin.allLocations], ['header', t().admin.headerLoc], ['social', t().admin.socialLoc]] as [v, label]}
				<button
					type="button"
					onclick={() => applyLoc(v)}
					aria-pressed={fLoc === v}
					class="rounded-full border px-4 py-1.5 text-sm font-bold transition {fLoc === v ? 'border-brand bg-brand text-brand-ink' : 'border-line hover:border-brand'}"
				>{label}</button>
			{/each}
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
							<th class="px-4 py-3">{t().admin.orderCol}</th>
							<th class="px-4 py-3">{t().admin.locationCol}</th>
							<th class="px-4 py-3">{t().admin.labelId} / {t().admin.labelEn}</th>
							<th class="px-4 py-3">{t().admin.linkHref}</th>
							<th class="px-4 py-3">{t().admin.visibleCol}</th>
							<th class="px-4 py-3">{t().admin.actions}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-line">
						{#each items as m}
							<tr>
								<td class="px-4 py-2.5 font-mono">{m.sort}</td>
								<td class="px-4 py-2.5"><span class="rounded-full bg-band px-2.5 py-0.5 text-xs font-bold">{locLabel(m.location)}</span></td>
								<td class="px-4 py-2.5">
									<span class="block font-semibold">{m.labelId || '—'}</span>
									<span class="block text-xs text-muted">{m.labelEn || '—'}</span>
								</td>
								<td class="max-w-[220px] truncate px-4 py-2.5 font-mono text-[13px]">{m.href}</td>
								<td class="px-4 py-2.5">
									<button
										type="button"
										onclick={() => toggleVisible(m)}
										aria-pressed={m.visible === 1}
										class="rounded-full px-2.5 py-0.5 text-xs font-bold {m.visible === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}"
									>{m.visible === 1 ? t().admin.visibleCol : t().admin.hidden}</button>
								</td>
								<td class="px-4 py-2.5">
									<div class="flex gap-1.5">
										<a href={localize(`/admin/menus/${m.id}/edit`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editItem}</a>
										{#if confirming === m.id}
											<button type="button" onclick={() => remove(m.id)} class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{t().admin.yesDelete}</button>
											<button type="button" onclick={() => (confirming = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>
										{:else}
											<button type="button" onclick={() => (confirming = m.id)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.delete}</button>
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
