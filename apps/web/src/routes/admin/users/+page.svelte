<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type UserRow = { id: number; email: string; name: string; status: string; roles: string[] };

	let users = $state<UserRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');

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
						<th class="px-4 py-3">{t().admin.email}</th>
						<th class="px-4 py-3">{t().admin.name}</th>
						<th class="px-4 py-3">{t().admin.editRoles}</th>
						<th class="px-4 py-3">{t().admin.status}</th>
						<th class="px-4 py-3">{t().admin.actions}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each users as u}
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
