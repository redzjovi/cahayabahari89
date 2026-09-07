<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type UserRow = { id: number; email: string; name: string; status: string; roles: string[]; createdAt?: string | null };

	let users = $state<UserRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	type SortKey = 'email' | 'name' | 'status' | 'created';
	let sortKey = $state<SortKey>('created');
	let sortDir = $state<'asc' | 'desc'>('desc');

	const canView = $derived(adminSession.can('users.manage'));

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await adminSession.api('/api/admin/users');
			if (!res.ok) throw new Error('load');
			users = (await res.json()) as UserRow[];
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
		const arr = [...users];
		const dir = sortDir === 'asc' ? 1 : -1;
		switch (sortKey) {
			case 'created':
				arr.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') * dir);
				break;
			case 'status':
				arr.sort((a, b) => a.status.localeCompare(b.status) * dir);
				break;
			case 'email':
				arr.sort((a, b) => a.email.localeCompare(b.email) * dir);
				break;
			case 'name':
				arr.sort((a, b) => a.name.localeCompare(b.name) * dir);
				break;
		}
		return arr;
	});

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'created' ? 'desc' : 'asc';
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
</script>

<svelte:head><title>{t().admin.users} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.users}</h1>
		<button type="button" onclick={() => goto(localize('/admin/users/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
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
					{#each sorted as u}
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
	{/if}
</section>
