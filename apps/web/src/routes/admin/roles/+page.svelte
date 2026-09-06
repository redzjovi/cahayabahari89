<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { adminSession } from '$lib/admin-session.svelte';
	import { onMount } from 'svelte';

	type RoleRow = { id: number; slug: string; name: string; permissions: string[]; users: number };
	type PermRow = { id: number; slug: string; name: string };

	let roles = $state<RoleRow[]>([]);
	let perms = $state<PermRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');

	let showCreateRole = $state(false);
	let rSlug = $state('');
	let rName = $state('');
	let rPerms = $state<string[]>([]);
	let editingPerms: string | null = $state(null);
	let ePerms = $state<string[]>([]);
	let renaming: string | null = $state(null);
	let renameName = $state('');
	let confirmingRole: string | null = $state(null);

	let showCreatePerm = $state(false);
	let pSlug = $state('');
	let pName = $state('');
	let renamingPerm: string | null = $state(null);
	let renamePermName = $state('');
	let confirmingPerm: string | null = $state(null);

	const canView = $derived(adminSession.can('roles.manage'));

	async function load() {
		loading = true;
		error = '';
		try {
			const [rRes, pRes] = await Promise.all([adminSession.api('/api/admin/roles'), adminSession.api('/api/admin/permissions')]);
			if (!rRes.ok || !pRes.ok) throw new Error('load');
			roles = (await rRes.json()) as RoleRow[];
			perms = (await pRes.json()) as PermRow[];
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
		if (e.includes('already exists')) return t().admin.duplicate;
		if (e.includes('unknown')) return t().admin.unknownRef;
		if (e.includes('assigned')) return t().admin.roleDeleteBlocked;
		return e || t().admin.loadFail;
	}

	function toggle(list: string[], v: string, on: boolean) {
		return on ? [...list, v] : list.filter((x) => x !== v);
	}

	async function createRole(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		notice = '';
		try {
			const res = await adminSession.api('/api/admin/roles', {
				method: 'POST',
				body: JSON.stringify({ slug: rSlug.trim().toLowerCase(), name: rName, permissions: rPerms })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.created;
			rSlug = rName = '';
			rPerms = [];
			showCreateRole = false;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function saveRolePerms(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/roles/${slug}`, { method: 'PATCH', body: JSON.stringify({ permissions: ePerms }) });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.saved;
			editingPerms = null;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function saveRename(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/roles/${slug}`, { method: 'PATCH', body: JSON.stringify({ name: renameName }) });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.saved;
			renaming = null;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
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

	async function createPerm(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		notice = '';
		try {
			const res = await adminSession.api('/api/admin/permissions', {
				method: 'POST',
				body: JSON.stringify({ slug: pSlug.trim().toLowerCase(), name: pName })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.created;
			pSlug = pName = '';
			showCreatePerm = false;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function savePermRename(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/permissions/${slug}`, { method: 'PATCH', body: JSON.stringify({ name: renamePermName }) });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.saved;
			renamingPerm = null;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function deletePerm(slug: string) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/permissions/${slug}`, { method: 'DELETE' });
			if (!res.ok) {
				error = apiError(await res.json());
				confirmingPerm = null;
				return;
			}
			notice = t().admin.saved;
			confirmingPerm = null;
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
		<button type="button" onclick={() => (showCreateRole = !showCreateRole)} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.createRole}
		</button>
	</div>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else}
		{#if showCreateRole}
			<form onsubmit={createRole} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-2">
				<label class="grid gap-1.5 text-sm font-semibold">{t().admin.roleSlug}<input bind:value={rSlug} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
				<label class="grid gap-1.5 text-sm font-semibold">{t().admin.roleName}<input bind:value={rName} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
				<fieldset class="grid gap-1.5 text-sm font-semibold sm:col-span-2">
					Permissions
					<div class="flex flex-wrap gap-3 font-normal">
						{#each perms as p}
							<label class="flex cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={rPerms.includes(p.slug)} onchange={(e) => (rPerms = toggle(rPerms, p.slug, e.currentTarget.checked))} class="accent-[var(--brand)]" />{p.slug}</label>
						{/each}
					</div>
				</fieldset>
				<p class="text-xs text-muted sm:col-span-2">{t().admin.roleSlugHint}</p>
				<div class="flex gap-2 sm:col-span-2">
					<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
					<button type="button" onclick={() => (showCreateRole = false)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</button>
				</div>
			</form>
		{/if}

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
						<button type="button" onclick={() => { editingPerms = r.slug; ePerms = [...r.permissions]; }} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.permissionsTitle}</button>
						<button type="button" onclick={() => { renaming = r.slug; renameName = r.name; }} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.rename}</button>
						{#if confirmingRole === r.slug}
							<button type="button" onclick={() => deleteRole(r.slug)} class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{t().admin.yesDelete}</button>
							<button type="button" onclick={() => (confirmingRole = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>
						{:else}
							<button type="button" onclick={() => (confirmingRole = r.slug)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.delete}</button>
						{/if}
					</div>
					{#if editingPerms === r.slug}
						<div class="mt-3 rounded-lg border border-line p-3">
							<div class="flex flex-wrap gap-2.5">
								{#each perms as p}
									<label class="flex cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={ePerms.includes(p.slug)} onchange={(e) => (ePerms = toggle(ePerms, p.slug, e.currentTarget.checked))} class="accent-[var(--brand)]" />{p.slug}</label>
								{/each}
							</div>
							<div class="mt-3 flex gap-1.5">
								<button type="button" onclick={() => saveRolePerms(r.slug)} class="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-ink">{t().admin.save}</button>
								<button type="button" onclick={() => (editingPerms = null)} class="rounded-full border border-line px-4 py-1.5 text-xs font-bold">{t().admin.cancel}</button>
							</div>
						</div>
					{/if}
					{#if renaming === r.slug}
						<div class="mt-3 flex gap-1.5">
							<input bind:value={renameName} minlength="2" class="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm font-normal" />
							<button type="button" onclick={() => saveRename(r.slug)} class="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-ink">{t().admin.save}</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="mt-10">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="font-display text-2xl font-bold">{t().admin.permissionsTitle}</h2>
				<button type="button" onclick={() => (showCreatePerm = !showCreatePerm)} class="rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-brand">+ {t().admin.create}</button>
			</div>
			<p class="mt-1 text-sm text-muted">{t().admin.permissionsNote}</p>
			{#if showCreatePerm}
				<form onsubmit={createPerm} class="mt-4 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-3">
					<label class="grid gap-1.5 text-sm font-semibold">{t().admin.permissionSlug}<input bind:value={pSlug} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
					<label class="grid gap-1.5 text-sm font-semibold">{t().admin.permissionName}<input bind:value={pName} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
					<div class="flex items-end gap-2">
						<button type="submit" class="rounded-full bg-brand px-5 py-2 text-sm font-bold text-brand-ink">{t().admin.create}</button>
						<button type="button" onclick={() => (showCreatePerm = false)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</button>
					</div>
				</form>
			{/if}
			<div class="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
				<table class="w-full min-w-[520px] text-left text-sm">
					<thead>
						<tr class="border-b border-line text-xs uppercase tracking-wider text-muted">
							<th class="px-4 py-3">{t().admin.permissionSlug}</th>
							<th class="px-4 py-3">{t().admin.permissionName}</th>
							<th class="px-4 py-3">{t().admin.actions}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-line">
						{#each perms as p}
							<tr>
								<td class="px-4 py-2.5 font-mono text-[13px] font-semibold">{p.slug}</td>
								<td class="px-4 py-2.5">
									{#if renamingPerm === p.slug}
										<span class="flex gap-1.5">
											<input bind:value={renamePermName} minlength="2" class="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm font-normal" />
											<button type="button" onclick={() => savePermRename(p.slug)} class="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-ink">{t().admin.save}</button>
										</span>
									{:else}{p.name}{/if}
								</td>
								<td class="px-4 py-2.5">
									<div class="flex gap-1.5">
										<button type="button" onclick={() => { renamingPerm = p.slug; renamePermName = p.name; }} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.rename}</button>
										{#if confirmingPerm === p.slug}
											<button type="button" onclick={() => deletePerm(p.slug)} class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{t().admin.yesDelete}</button>
											<button type="button" onclick={() => (confirmingPerm = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>
										{:else}
											<button type="button" onclick={() => (confirmingPerm = p.slug)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.delete}</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</section>
