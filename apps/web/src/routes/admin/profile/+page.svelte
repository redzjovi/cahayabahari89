<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { adminSession } from '$lib/admin-session.svelte';
	import Field from '$lib/components/Field.svelte';
	import { onMount } from 'svelte';

	let fName = $state('');
	let profileError = $state('');
	let profileOk = $state(false);
	let profileBusy = $state(false);

	let cur = $state('');
	let next = $state('');
	let confirm = $state('');
	let showPw = $state(false);
	let pwError = $state('');
	let pwOk = $state(false);
	let pwBusy = $state(false);

	let loading = $state(true);

	onMount(async () => {
		adminSession.init();
		if (await adminSession.refresh()) fName = adminSession.user?.name ?? '';
		loading = false;
	});

	function apiError(json: unknown): string {
		const j = json as { message?: string; errors?: Record<string, string | string[]> };
		const e = j.message ?? Object.values(j.errors ?? {}).flat().join(' ') ?? '';
		if (e.includes('invalid current password')) return t().admin.wrongCurrent;
		if (e.includes('must differ')) return t().admin.passwordSame;
		return e || t().admin.loadFail;
	}

	async function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		profileError = '';
		profileOk = false;
		const name = fName.trim();
		if (name.length < 2) {
			profileError = t().admin.loadFail;
			return;
		}
		profileBusy = true;
		try {
			const res = await adminSession.api('/api/auth/profile', { method: 'PATCH', body: JSON.stringify({ name }) });
			if (!res.ok) {
				profileError = apiError(await res.json());
				return;
			}
			await adminSession.refresh();
			profileOk = true;
		} catch {
			profileError = t().admin.loadFail;
		} finally {
			profileBusy = false;
		}
	}

	async function savePassword(e: SubmitEvent) {
		e.preventDefault();
		pwError = '';
		pwOk = false;
		if (next.length < 8) {
			pwError = t().admin.passwordMin;
			return;
		}
		if (next !== confirm) {
			pwError = t().admin.passwordMismatch;
			return;
		}
		if (next === cur) {
			pwError = t().admin.passwordSame;
			return;
		}
		pwBusy = true;
		try {
			const res = await adminSession.api('/api/auth/password', {
				method: 'PATCH',
				body: JSON.stringify({ currentPassword: cur, newPassword: next })
			});
			if (!res.ok) {
				pwError = apiError(await res.json());
				return;
			}
			cur = next = confirm = '';
			pwOk = true;
		} catch {
			pwError = t().admin.loadFail;
		} finally {
			pwBusy = false;
		}
	}
</script>

<svelte:head><title>{t().admin.profileTitle} — Admin</title></svelte:head>

<section class="content-wrap max-w-3xl py-10">
	<h1 class="font-display text-3xl font-bold">{t().admin.profileTitle}</h1>

	{#if loading}
		<p class="mt-6 text-muted">…</p>
	{:else}
		<h2 class="mt-8 text-lg font-bold">{t().admin.profileSection}</h2>
		{#if profileError}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{profileError}</p>{/if}
		{#if profileOk}<p class="mt-4 rounded-lg bg-green-500/10 p-3 text-sm font-medium text-green-600">{t().admin.saved}</p>{/if}
		<form onsubmit={saveProfile} class="mt-4 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.name} required><input bind:value={fName} required minlength="2" maxlength="100" autocomplete="name" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.email}><input value={adminSession.user?.email ?? ''} disabled class="w-full rounded-lg border bg-band px-4 py-2.5 font-normal text-muted" /></Field>
			<Field label={t().admin.editRoles}><input value={(adminSession.user?.roles ?? []).join(', ') || '—'} disabled class="w-full rounded-lg border bg-band px-4 py-2.5 font-normal text-muted" /></Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" disabled={profileBusy} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-50">{t().admin.save}</button>
			</div>
		</form>

		<h2 class="mt-10 text-lg font-bold">{t().admin.passwordSection}</h2>
		{#if pwError}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{pwError}</p>{/if}
		{#if pwOk}<p class="mt-4 rounded-lg bg-green-500/10 p-3 text-sm font-medium text-green-600">{t().admin.saved}</p>{/if}
		<form onsubmit={savePassword} class="mt-4 grid gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
			<Field label={t().admin.currentPassword} required>
				<span class="relative block font-normal">
					<input
						type={showPw ? 'text' : 'password'}
						bind:value={cur}
						required
						autocomplete="current-password"
						class="w-full rounded-lg border px-4 py-2.5 pr-11 font-normal"
					/>
					<button
						type="button"
						onclick={() => (showPw = !showPw)}
						aria-pressed={showPw}
						aria-label={showPw ? t().admin.hidePassword : t().admin.showPassword}
						class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted transition hover:text-ink"
					>
						{#if showPw}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
						{/if}
					</button>
				</span>
			</Field>
			<Field label={t().admin.newPassword} required><input type={showPw ? 'text' : 'password'} bind:value={next} required minlength="8" maxlength="200" autocomplete="new-password" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<Field label={t().admin.confirmPassword} required><input type={showPw ? 'text' : 'password'} bind:value={confirm} required minlength="8" maxlength="200" autocomplete="new-password" class="w-full rounded-lg border px-4 py-2.5 font-normal" /></Field>
			<div class="flex gap-2 sm:pl-[196px]">
				<button type="submit" disabled={pwBusy} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-50">{t().admin.save}</button>
			</div>
		</form>
	{/if}
</section>
