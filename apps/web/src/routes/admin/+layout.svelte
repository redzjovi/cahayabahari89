<script lang="ts">
	import { adminSession } from '$lib/admin-session.svelte';
	import { t } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import FishMark from '$lib/components/FishMark.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { browser } from '$app/environment';

	let { children, data } = $props();
	let checked = $state(false);
	let authed = $state(false);
	let menuOpen = $state(false);
	// Collapsed sidebar groups, keyed by the group's first item href (locale-stable).
	// Persisted per browser; the active page's group always auto-opens.
	const GROUPS_KEY = 'cb89-admin-groups';
	let collapsed = $state<Record<string, boolean>>({});

	const isLogin = $derived(page.url.pathname.endsWith('/login'));

	const groups = $derived.by(() => {
		const all = [
			{
				title: () => t().admin.groupStore,
				items: [
					{ href: '/admin/products', label: () => t().admin.productsTitle, show: adminSession.can('products.write') },
					{ href: '/admin/featured', label: () => t().admin.featuredTitle, show: adminSession.can('products.write') },
					{ href: '/admin/categories', label: () => t().admin.categoriesTitle, show: adminSession.can('categories.write') }
				]
			},
			{
				title: () => t().admin.groupContent,
				items: [
					{ href: '/admin/menus', label: () => t().admin.menusTitle, show: adminSession.can('content.manage') },
					{ href: '/admin/content', label: () => t().admin.contentTitle, show: adminSession.can('content.manage') }
				]
			},
			{
				title: () => t().admin.groupLeads,
				items: [{ href: '/admin/leads', label: () => t().admin.leads, show: adminSession.can('leads.read') }]
			},
			{
				title: () => t().admin.groupSystem,
				items: [
					{ href: '/admin/users', label: () => t().admin.users, show: adminSession.can('users.manage') },
					{ href: '/admin/roles', label: () => t().admin.roles, show: adminSession.can('roles.manage') },
					{ href: '/admin/permissions', label: () => t().admin.permissionsTitle, show: adminSession.can('roles.manage') }
				]
			}
		];
		return all
			.map((g) => ({ title: g.title, items: g.items.filter((i) => i.show) }))
			.filter((g) => g.items.length > 0);
	});
	const flatItems = $derived(groups.flatMap((g) => g.items));

	const storefrontHref = $derived(localize('/', data.locale));

	const activeInternal = $derived.by(() => {
		const p = page.url.pathname;
		const seg = p.split('/').filter(Boolean).pop();
		const path = p.replace(/\/+$/, '');
		for (const it of flatItems) {
			if (path === localize(it.href, data.locale) || path.startsWith(localize(it.href + '/', data.locale))) return it.href;
		}
		return '';
	});

	onMount(async () => {
		adminSession.init();
		if (browser) {
			try {
				const raw = localStorage.getItem(GROUPS_KEY);
				if (raw) collapsed = (JSON.parse(raw) as Record<string, boolean>) ?? {};
			} catch {
				// ignore (private mode / corrupt value)
			}
		}
		authed = await adminSession.refresh();
		if (!authed && !isLogin) await goto(localize('/admin/login', data.locale));
		if (authed && isLogin) await goto(localize('/admin/users', data.locale));
		checked = true;
	});

	function groupKey(items: { href: string }[]): string {
		return items[0]?.href ?? '';
	}

	function isCollapsed(key: string): boolean {
		return collapsed[key] === true;
	}

	function toggleGroup(key: string) {
		collapsed = { ...collapsed, [key]: !isCollapsed(key) };
		if (browser) {
			try {
				localStorage.setItem(GROUPS_KEY, JSON.stringify(collapsed));
			} catch {
				// ignore (private mode)
			}
		}
	}

	// The active page's group always opens (runs on route change, never fights
	// same-page toggle clicks since those don't change activeInternal).
	$effect(() => {
		const active = activeInternal;
		if (!active) return;
		const g = groups.find((gr) => gr.items.some((i) => i.href === active));
		const key = g ? groupKey(g.items) : '';
		if (key && collapsed[key]) {
			const next = { ...collapsed };
			delete next[key];
			collapsed = next;
		}
	});

	async function logout() {
		await adminSession.logout();
	}

	function close() {
		menuOpen = false;
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
	<div class="px-4 py-16 text-center text-muted">…</div>
{:else if !authed}
	<div class="px-4 py-16 text-center text-muted">{t().admin.loadFail}</div>
{:else}
	<div class="lg:flex">
		<!-- Mobile drawer backdrop -->
		{#if menuOpen}
			<button type="button" aria-label="Close menu" onclick={close} class="fixed inset-0 z-40 bg-black/40 lg:hidden"></button>
		{/if}

		<!-- Sidebar -->
		<aside
			class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 {menuOpen ? 'translate-x-0' : '-translate-x-full'}"
			aria-hidden={!menuOpen}
		>
			<div class="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
				<span class="flex items-center gap-2 font-extrabold">
					<FishMark cls="h-5 w-5 text-accent-strong" />
					Admin
				</span>
				<button type="button" onclick={close} class="rounded-lg border border-line p-1.5 lg:hidden" aria-label="Close menu">
					<svg viewBox="0 0 16 16" class="h-4 w-4" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
				</button>
			</div>

			<nav class="flex-1 space-y-3 overflow-y-auto px-3 py-4 text-sm font-bold">
				{#each groups as g (groupKey(g.items))}
					{@const key = groupKey(g.items)}
					<div>
						<button
							type="button"
							onclick={() => toggleGroup(key)}
							aria-expanded={!isCollapsed(key)}
							class="flex w-full items-center justify-between rounded-lg px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted transition hover:text-ink"
						>
							<span>{g.title()}</span>
							<svg viewBox="0 0 16 16" class="h-3 w-3 transition-transform duration-200 {isCollapsed(key) ? '-rotate-90' : ''}" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
						</button>
						{#if !isCollapsed(key)}
							<div transition:slide={{ duration: 200 }} class="ml-3 space-y-1 border-l border-line pl-2">
								{#each g.items as it}
									<a
										href={localize(it.href, data.locale)}
										onclick={close}
										aria-current={activeInternal === it.href ? 'page' : undefined}
										class="block rounded-lg px-3 py-2 transition {activeInternal === it.href ? 'bg-brand text-brand-ink' : 'hover:bg-band'}"
									>{it.label()}</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
				<div class="mt-2 border-t border-line pt-2">
					<a
						href={storefrontHref}
						onclick={close}
						class="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-band"
					>
						<svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none" aria-hidden="true"><path d="M6 3h7v10H6M3 5H2v6h1M9 6l4 2-4 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
						{t().admin.backToSite}
					</a>
				</div>
			</nav>

			<div class="grid gap-2 border-t border-line px-4 py-3 text-sm">
				<a href={localize('/admin/profile', data.locale)} onclick={close} class="truncate text-muted underline hover:text-ink">{adminSession.user?.email}</a>
				<div class="flex items-center gap-2">
					<LangToggle />
					<button type="button" onclick={logout} class="ml-auto rounded-full border border-line px-3.5 py-1.5 text-xs font-bold transition hover:border-brand">{t().admin.logout}</button>
				</div>
			</div>
		</aside>

		<!-- Slim top row (mobile only) -->
		<div class="flex items-center gap-2 border-b border-line bg-band px-4 py-2.5 lg:hidden">
			<button type="button" onclick={() => (menuOpen = true)} class="rounded-lg border border-line p-2" aria-label="Open menu">
				<svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
			</button>
			<span class="font-extrabold">Admin</span>
		</div>

		<!-- Content -->
		<div class="min-w-0 flex-1">
			{@render children()}
		</div>
	</div>
{/if}
