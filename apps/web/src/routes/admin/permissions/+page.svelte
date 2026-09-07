<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type PermRow = { id: number; slug: string; name: string };

	let perms = $state<PermRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let confirming: string | null = $state(null);
	type SortKey = 'slug' | 'name';
	let sortKey = $state<SortKey>('slug');
	let sortDir = $state<'asc' | 'desc'>('asc');

	const canView = $derived(adminSession.can('roles.manage'));

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await adminSession.api('/api/admin/permissions');
			if (!res.ok) throw new Error('load');
			perms = (await res.json()) as PermRow[];
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
		const arr = [...perms];
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
		if (e.includes('already exists')) return t().admin.duplicate;
		if (e.includes('assigned')) return t().admin.roleDeleteBlocked;
		return e || t().admin.loadFail;
	}

	async function remove(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/permissions/${slug}`, { method: 'DELETE' });
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

<svelte:head><title>{t().admin.permissionsTitle} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.permissionsTitle}</h1>
		<button type="button" onclick={() => goto(localize('/admin/permissions/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.newItem}
		</button>
	</div>
	<p class="mt-1 text-sm text-muted">{t().admin.permissionsNote}</p>

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
								aria-label={sortLabel('slug', t().admin.permissionSlug)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'slug' ? 'text-ink' : ''}"
							>
								<span>{t().admin.permissionSlug}</span>
								<span class="text-[10px] {sortKey === 'slug' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('slug')}</span>
							</button>
						</th>
						<th class="px-4 py-3" aria-sort={ariaSort('name')}>
							<button
								type="button"
								onclick={() => toggleSort('name')}
								aria-label={sortLabel('name', t().admin.permissionName)}
								class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'name' ? 'text-ink' : ''}"
							>
								<span>{t().admin.permissionName}</span>
								<span class="text-[10px] {sortKey === 'name' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('name')}</span>
							</button>
						</th>
						<th class="px-4 py-3">{t().admin.actions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each sorted as p}
						<tr>
							<td class="px-4 py-2.5 font-mono text-[13px] font-semibold">{p.slug}</td>
							<td class="px-4 py-2.5">{p.name}</td>
							<td class="px-4 py-2.5">
								<div class="flex gap-1.5">
									<a href={localize(`/admin/permissions/${p.slug}/edit`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editItem}</a>
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
	{/if}
</section>
