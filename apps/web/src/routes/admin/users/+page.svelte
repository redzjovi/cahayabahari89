<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { adminSession } from '$lib/admin-session.svelte';
	import { onMount } from 'svelte';

	type UserRow = { id: number; email: string; name: string; status: string; roles: string[] };
	type RoleRow = { slug: string; name: string };

	let users = $state<UserRow[]>([]);
	let roles = $state<RoleRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let showCreate = $state(false);
	let editingRoles: number | null = $state(null);
	let resettingPw: number | null = $state(null);

	// create form
	let fEmail = $state('');
	let fName = $state('');
	let fPassword = $state('');
	let fRoles = $state<string[]>([]);
	// per-row edit state
	let eRoles = $state<string[]>([]);
	let newPw = $state('');

	const canView = $derived(adminSession.can('users.manage'));

	async function load() {
		loading = true;
		error = '';
		try {
			const [uRes, rRes] = await Promise.all([adminSession.api('/api/admin/users'), adminSession.api('/api/admin/roles')]);
			if (!uRes.ok || !rRes.ok) throw new Error('load');
			users = (await uRes.json()) as UserRow[];
			const rRows = (await rRes.json()) as { slug: string; name: string }[];
			roles = rRows.map((r) => ({ slug: r.slug, name: r.name }));
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
		return e || t().admin.loadFail;
	}

	async function create(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		notice = '';
		try {
			const res = await adminSession.api('/api/admin/users', {
				method: 'POST',
				body: JSON.stringify({ email: fEmail, name: fName, password: fPassword, roles: fRoles })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.created;
			fEmail = fName = fPassword = '';
			fRoles = [];
			showCreate = false;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function setStatus(u: UserRow, status: 'active' | 'suspended') {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/users/${u.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.saved;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	function openRoles(u: UserRow) {
		editingRoles = u.id;
		eRoles = [...u.roles];
	}

	async function saveRoles(u: UserRow) {
		error = '';
		notice = '';
		try {
			const res = await adminSession.api(`/api/admin/users/${u.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ roles: eRoles })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.saved;
			editingRoles = null;
			await load();
		} catch {
			error = t().admin.loadFail;
		}
	}

	async function savePassword(u: UserRow) {
		error = '';
		notice = '';
		if (newPw.length < 8) {
			error = t().admin.passwordMin;
			return;
		}
		try {
			const res = await adminSession.api(`/api/admin/users/${u.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ password: newPw })
			});
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			notice = t().admin.saved;
			resettingPw = null;
			newPw = '';
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.users} — Admin</title></svelte:head>

<section class="content-wrap py-10">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="font-display text-3xl font-bold">{t().admin.users}</h1>
		<button type="button" onclick={() => (showCreate = !showCreate)} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">
			+ {t().admin.createUser}
		</button>
	</div>

	{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else}
		{#if showCreate}
			<form onsubmit={create} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card sm:grid-cols-2">
				<label class="grid gap-1.5 text-sm font-semibold">{t().admin.email}<input type="email" bind:value={fEmail} required class="rounded-lg border px-4 py-2.5 font-normal" /></label>
				<label class="grid gap-1.5 text-sm font-semibold">{t().admin.name}<input bind:value={fName} required minlength="2" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
				<label class="grid gap-1.5 text-sm font-semibold">{t().admin.password}<input type="password" bind:value={fPassword} required minlength="8" class="rounded-lg border px-4 py-2.5 font-normal" /></label>
				<fieldset class="grid gap-1.5 text-sm font-semibold">
					{t().admin.editRoles}
					<div class="flex flex-wrap gap-3 font-normal">
						{#each roles as r}
							<label class="flex cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" value={r.slug} checked={fRoles.includes(r.slug)} onchange={(e) => (fRoles = e.currentTarget.checked ? [...fRoles, r.slug] : fRoles.filter((x) => x !== r.slug))} class="accent-[var(--brand)]" />{r.slug}</label>
						{/each}
					</div>
				</fieldset>
				<div class="flex gap-2 sm:col-span-2">
					<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.create}</button>
					<button type="button" onclick={() => (showCreate = false)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</button>
				</div>
			</form>
		{/if}

		{#if loading}
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
								<td class="px-4 py-3 font-semibold">{u.email}</td>
								<td class="px-4 py-3">{u.name}</td>
								<td class="px-4 py-3">
									<div class="flex flex-wrap gap-1.5">
										{#each u.roles as r}<span class="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong">{r}</span>{:else}<span class="text-xs text-muted">—</span>{/each}
									</div>
									{#if editingRoles === u.id}
										<div class="mt-2 flex flex-wrap gap-2 rounded-lg border border-line p-2">
											{#each roles as r}
												<label class="flex cursor-pointer items-center gap-1 text-xs"><input type="checkbox" checked={eRoles.includes(r.slug)} onchange={(e) => (eRoles = e.currentTarget.checked ? [...eRoles, r.slug] : eRoles.filter((x) => x !== r.slug))} class="accent-[var(--brand)]" />{r.slug}</label>
											{/each}
											<button type="button" onclick={() => saveRoles(u)} class="rounded-full bg-brand px-3 py-1 text-xs font-bold text-brand-ink">{t().admin.save}</button>
											<button type="button" onclick={() => (editingRoles = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>
										</div>
									{/if}
								</td>
								<td class="px-4 py-3">
									<span class="rounded-full px-2.5 py-0.5 text-xs font-bold {u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}">
										{u.status === 'active' ? t().admin.active : t().admin.suspended}
									</span>
								</td>
								<td class="px-4 py-3">
									<div class="flex flex-wrap gap-1.5">
										<button type="button" onclick={() => openRoles(u)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editRoles}</button>
										{#if u.status === 'active'}
											<button type="button" onclick={() => setStatus(u, 'suspended')} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.suspend}</button>
										{:else}
											<button type="button" onclick={() => setStatus(u, 'active')} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.reactivate}</button>
										{/if}
										<button type="button" onclick={() => { resettingPw = u.id; newPw = ''; }} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.resetPassword}</button>
									</div>
									{#if resettingPw === u.id}
										<div class="mt-2 flex gap-1.5">
											<input type="password" bind:value={newPw} minlength="8" placeholder={t().admin.passwordMin} class="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-xs font-normal" />
											<button type="button" onclick={() => savePassword(u)} class="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-ink">{t().admin.save}</button>
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</section>
