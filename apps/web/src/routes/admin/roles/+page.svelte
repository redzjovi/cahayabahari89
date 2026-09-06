<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type RoleRow = { id: number; slug: string; name: string; permissions: string[]; users: number };

	let roles = $state<RoleRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let confirmingRole: string | null = $state(null);

	const canView = $derived(adminSession.can('roles.manage'));

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await adminSession.api('/api/admin/roles');
			if (!res.ok) throw new Error('load');
			roles = (await res.json()) as RoleRow[];
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

	function apiError(json: unknown): string {
		const e = (json as { error?: string }).error ?? '';
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
</script>

<svelte:head><title>{t().admin.roles} — Admin</title></svelte:head>

<section class="content-wrap py-10">
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
	{:else}
		<div class="mt-6 grid gap-4 lg:grid-cols-2">
			{#each roles as r}
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
	{/if}
</section>
