<script lang="ts">
	import { adminSession } from '$lib/admin-session.svelte';
	import { t } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import FishMark from '$lib/components/FishMark.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children, data } = $props();
	let checked = $state(false);
	let authed = $state(false);

	const isLogin = $derived(page.url.pathname.endsWith('/login'));

	onMount(async () => {
		adminSession.init();
		authed = await adminSession.refresh();
		if (!authed && !isLogin) await goto(localize('/admin/login', data.locale));
		if (authed && isLogin) await goto(localize('/admin/users', data.locale));
		checked = true;
	});

	async function logout() {
		await adminSession.logout();
	}
</script>

{#if isLogin}
	<!-- Login is public: SSR the form immediately, no session wait. -->
	<div class="border-b border-line bg-band">
		<div class="content-wrap flex flex-wrap items-center gap-3 py-3">
			<span class="flex items-center gap-2 font-extrabold">
				<FishMark cls="h-5 w-5 text-accent-strong" />
				Admin
			</span>
			<span class="ml-auto"><LangToggle /></span>
		</div>
	</div>
	{@render children()}
{:else if !checked}
	<div class="content-wrap py-16 text-center text-muted">…</div>
{:else if !authed}
	<div class="content-wrap py-16 text-center text-muted">{t().admin.loadFail}</div>
{:else}
	<div class="border-b border-line bg-band">
		<div class="content-wrap flex flex-wrap items-center gap-3 py-3">
			<span class="flex items-center gap-2 font-extrabold">
				<FishMark cls="h-5 w-5 text-accent-strong" />
				Admin
			</span>
			<nav class="flex items-center gap-1 text-sm font-bold">
				{#if adminSession.can('users.manage')}
					<a href={localize('/admin/users', data.locale)} class="rounded-full px-3.5 py-1.5 transition hover:bg-surface">{t().admin.users}</a>
				{/if}
				{#if adminSession.can('roles.manage')}
					<a href={localize('/admin/roles', data.locale)} class="rounded-full px-3.5 py-1.5 transition hover:bg-surface">{t().admin.roles}</a>
				{/if}
			</nav>
			<span class="ml-auto flex items-center gap-2">
				<span class="hidden text-sm text-muted sm:inline">{adminSession.user?.email}</span>
				<LangToggle />
				<button type="button" onclick={logout} class="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-bold transition hover:border-brand">{t().admin.logout}</button>
			</span>
		</div>
	</div>
	{@render children()}
{/if}
