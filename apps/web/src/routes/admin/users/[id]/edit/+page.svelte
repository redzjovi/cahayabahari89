<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const id = $derived(Number(page.params.id as string));

	let roles = $state<{ slug: string; name: string }[]>([]);
	let error = $state('');
	let loading = $state(true);
	let notFound = $state(false);

	let fName = $state('');
	let fEmail = $state('');
	let fStatus = $state('active');
	let fRoles = $state<string[]>([]);
	let newPw = $state('');

	const canView = $derived(adminSession.can('users.manage'));

	async function load() {
		loading = true;
		error = '';
		notFound = false;
		try {
			const [uRes, rRes] = await Promise.all([adminSession.api('/api/admin/users'), adminSession.api('/api/admin/roles')]);
			if (!uRes.ok || !rRes.ok) throw new Error('load');
			const all = ((await uRes.json()) as { data: { id: number; email: string; name: string; status: string; roles: string[] }[] }).data;
			const found = all.find((u) => u.id === id);
			if (!found) {
				notFound = true;
				return;
			}
			fEmail = found.email;
			fName = found.name;
			fStatus = found.status;
			fRoles = [...found.roles];
			roles = (((await rRes.json()) as { data: { slug: string; name: string }[] }).data).map((r) => ({ slug: r.slug, name: r.name }));
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
		const j = json as { message?: string; errors?: Record<string, string | string[]> };
		const e = j.message ?? Object.values(j.errors ?? {}).flat().join(' ') ?? '';
		if (e.includes('unknown')) return t().admin.unknownRef;
		return e || t().admin.loadFail;
	}

	async function save(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (newPw !== '' && newPw.length < 8) {
			error = t().admin.passwordMin;
			return;
		}
		const payload: Record<string, unknown> = { name: fName, status: fStatus, roles: fRoles };
		if (newPw !== '') payload.password = newPw;
		try {
			const res = await adminSession.api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
			if (!res.ok) {
				error = apiError(await res.json());
				return;
			}
			await goto(localize('/admin/users', locale.current));
		} catch {
			error = t().admin.loadFail;
		}
	}
</script>

<svelte:head><title>{t().admin.editItem}: {fEmail || `#${id}`} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<a href={localize('/admin/users', locale.current)} class="text-sm font-semibold text-muted underline hover:text-ink">&larr; {t().admin.users}</a>
	<h1 class="mt-3 font-display text-3xl font-bold">{t().admin.editItem}: {fEmail || `#${id}`}</h1>

	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else if notFound}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">404</p>
	{:else}
		{#if error}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>{/if}
		<form onsubmit={save} class="mt-6 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.name} required><input bind:value={fName} required minlength="2" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.status}>
				<select bind:value={fStatus} class="w-full rounded-lg border px-4 py-2.5 font-normal">
					<option value="active">{t().admin.active}</option>
					<option value="suspended">{t().admin.suspended}</option>
				</select>
			</Field>
			<Field label={t().admin.editRoles}>
				<span class="flex flex-wrap gap-3">
					{#each roles as r}
						<label class="flex cursor-pointer items-center gap-1.5 text-sm font-normal"><input type="checkbox" checked={fRoles.includes(r.slug)} onchange={(e) => (fRoles = e.currentTarget.checked ? [...fRoles, r.slug] : fRoles.filter((x) => x !== r.slug))} class="accent-[var(--brand)]" />{r.slug}</label>
					{/each}
				</span>
			</Field>
			<Field label={t().admin.resetPassword}><input type="password" bind:value={newPw} minlength="8" placeholder="—" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink">{t().admin.save}</button>
				<a href={localize('/admin/users', locale.current)} class="rounded-full border border-line px-5 py-2 text-sm font-bold">{t().admin.cancel}</a>
			</div>
		</form>
	{/if}
</section>
