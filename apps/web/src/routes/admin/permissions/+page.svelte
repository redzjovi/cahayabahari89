<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { localize } from '$lib/routes';
	import { adminSession } from '$lib/admin-session.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PAGE_SIZES, readIntParam, readStringParam, buildSearch, gotoSamePage } from '$lib/admin-pagination';
	import { createQuery, keepPreviousData, useQueryClient } from '@tanstack/svelte-query';
	import { fetchJson } from '$lib/queries/fetcher';
	import { qk } from '$lib/queries/keys';
	type PermRow = { id: number; slug: string; name: string };
	let notice = $state('');
	let confirming: string | null = $state(null);
	let errorMsg = $state('');
	type SortKey = 'slug' | 'name';
	const SORT_API: Record<SortKey, { asc: string; desc: string; default: 'asc' | 'desc' }> = { slug: { asc: 'slug_asc', desc: 'slug_desc', default: 'asc' }, name: { asc: 'name_asc', desc: 'name_desc', default: 'asc' } };
	const SORT_FROM_API: Record<string, { key: SortKey; dir: 'asc' | 'desc' }> = {};
	for (const [k, v] of Object.entries(SORT_API)) { SORT_FROM_API[v.asc] = { key: k as SortKey, dir: 'asc' }; SORT_FROM_API[v.desc] = { key: k as SortKey, dir: 'desc' }; }
	let sortKey = $state<SortKey>('slug');
	let sortDir = $state<'asc' | 'desc'>('asc');
	let currentPage = $state(1);
	let pageSize = $state<10 | 25 | 50 | 100>(10);
	let authed = $state(false);
	const canView = $derived(adminSession.can('roles.manage'));
	function currentSortApi(){ const m=SORT_API[sortKey]; return sortDir==='asc'?m.asc:m.desc; }
	function currentSearchHref(){ return buildSearch({ page: currentPage, limit: pageSize, sort: currentSortApi() }); }
	const queryClient=useQueryClient();
	const params=$derived({ page: currentPage, limit: pageSize, sort: currentSortApi() });
	const permsQuery=createQuery(()=>({ queryKey: qk.perms(params), enabled: authed&&canView, placeholderData: keepPreviousData, staleTime: 45_000, queryFn: async ({signal})=>{ const p=new URLSearchParams(); p.set('page',String(params.page)); p.set('limit',String(params.limit)); p.set('sort',params.sort as string); return fetchJson<{data:PermRow[];meta:{total:number}}>(`/api/admin/permissions?${p.toString()}`,{signal}); }}));
	const items=$derived(permsQuery.data?.data??[]);
	const total=$derived(permsQuery.data?.meta.total??0);
	const pageCount=$derived(Math.max(1,Math.ceil(total/pageSize)));
	const loading=$derived(permsQuery.isPending);
	const isFetching=$derived(permsQuery.isFetching);
	const queryError=$derived(permsQuery.error? t().admin.loadFail:'');
	const displayError=$derived(errorMsg||queryError);
	$effect(()=>{ if(!permsQuery.isPending && items.length===0 && currentPage>1 && total>0){ currentPage=1; void gotoSamePage(currentSearchHref()); }});
	$effect(()=>{ if(currentPage<pageCount && authed&&canView){ const next={...params,page:currentPage+1}; queryClient.prefetchQuery({ queryKey: qk.perms(next), staleTime:45_000, queryFn: async({signal})=>{ const p=new URLSearchParams(); p.set('page',String(next.page)); p.set('limit',String(next.limit)); p.set('sort',next.sort as string); return fetchJson<{data:PermRow[];meta:{total:number}}>(`/api/admin/permissions?${p.toString()}`,{signal}); }}); }});
	onMount(async()=>{ adminSession.init(); authed=await adminSession.refresh(); if(!authed) return; const s=readStringParam('sort'); const m=s?SORT_FROM_API[s]:null; if(m){sortKey=m.key; sortDir=m.dir;} currentPage=readIntParam('page',1); pageSize=(readIntParam('limit',10,[...PAGE_SIZES]) as 10|25|50|100); });
	function apiError(json: unknown){ const j=json as {message?:string;errors?:Record<string,string|string[]>}; const e=j.message??Object.values(j.errors??{}).flat().join(' ')??''; if(e.includes('already exists')) return t().admin.duplicate; if(e.includes('assigned')) return t().admin.roleDeleteBlocked; return e||t().admin.loadFail; }
	async function remove(slug:string){ errorMsg=''; notice=''; try{ const res=await adminSession.api(`/api/admin/permissions/${slug}`,{method:'DELETE'}); if(!res.ok){ errorMsg=apiError(await res.json()); confirming=null; return;} notice=t().admin.saved; confirming=null; queryClient.invalidateQueries({queryKey:['admin','perms']}); queryClient.invalidateQueries({queryKey: qk.authMe()}); }catch{ errorMsg=t().admin.loadFail; } }
	function toggleSort(key: SortKey){ if(sortKey===key) sortDir=sortDir==='asc'?'desc':'asc'; else {sortKey=key; sortDir=SORT_API[key].default;} currentPage=1; void (async()=>{ await gotoSamePage(currentSearchHref()); })(); }
	function ariaSort(key: SortKey): 'ascending'|'descending'|'none' { if(sortKey!==key) return 'none'; return sortDir==='asc'?'ascending':'descending'; }
	function sortLabel(key: SortKey, col:string){ const raw=sortKey===key?(sortDir==='asc'?t().admin.sortedAsc:t().admin.sortedDesc):t().admin.sortBy; return raw.replace('{col}',col); }
	function sortIndicator(key: SortKey){ if(sortKey!==key) return '↕'; return sortDir==='asc'?'▲':'▼'; }
	async function setPage(p:number){ const next=Math.max(1,Math.min(pageCount,p)); if(next===currentPage) return; currentPage=next; await gotoSamePage(currentSearchHref()); }
	async function setPageSize(s:number){ pageSize=(s as 10|25|50|100); currentPage=1; await gotoSamePage(currentSearchHref()); }
</script>

<svelte:head><title>{t().admin.permissionsTitle} — Admin</title></svelte:head>

<section class="px-4 py-10 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3"><h1 class="font-display text-3xl font-bold">{t().admin.permissionsTitle}</h1><button type="button" onclick={() => goto(localize('/admin/permissions/new', locale.current))} class="rounded-full bg-brand px-5 py-2 font-bold text-brand-ink transition hover:brightness-110">+ {t().admin.newItem}</button></div>
	<p class="mt-1 text-sm text-muted">{t().admin.permissionsNote}</p>
	{#if displayError}<p class="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500">{displayError}</p>{/if}
	{#if notice}<p class="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">{notice}</p>{/if}
	{#if isFetching && !loading}<p class="mt-2 text-xs text-muted">Updating…</p>{/if}
	{#if !canView}
		<p class="mt-6 rounded-card border border-line p-6 text-muted">{t().admin.noAccess}</p>
	{:else if loading}
		<p class="mt-6 text-muted">…</p>
	{:else if items.length === 0}
		<p class="mt-6 rounded-card border border-dashed border-line p-6 text-center text-muted">{t().admin.noResults}</p>
	{:else}
		<div class="mt-6 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
			<table class="w-full min-w-[520px] text-left text-sm">
				<thead><tr class="border-b border-line text-xs uppercase tracking-wider text-muted"><th class="px-4 py-3" aria-sort={ariaSort('slug')}><button type="button" onclick={() => toggleSort('slug')} aria-label={sortLabel('slug', t().admin.permissionSlug)} class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'slug' ? 'text-ink' : ''}"><span>{t().admin.permissionSlug}</span><span class="text-[10px] {sortKey === 'slug' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('slug')}</span></button></th><th class="px-4 py-3" aria-sort={ariaSort('name')}><button type="button" onclick={() => toggleSort('name')} aria-label={sortLabel('name', t().admin.permissionName)} class="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition hover:text-ink {sortKey === 'name' ? 'text-ink' : ''}"><span>{t().admin.permissionName}</span><span class="text-[10px] {sortKey === 'name' ? 'opacity-100' : 'opacity-40'}" aria-hidden="true">{sortIndicator('name')}</span></button></th><th class="px-4 py-3">{t().admin.actions}</th></tr></thead>
				<tbody class="divide-y divide-line">{#each items as p}<tr><td class="px-4 py-2.5 font-mono text-[13px] font-semibold">{p.slug}</td><td class="px-4 py-2.5">{p.name}</td><td class="px-4 py-2.5"><div class="flex gap-1.5"><a href={localize(`/admin/permissions/${p.slug}/edit`, locale.current)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.editItem}</a>{#if confirming === p.slug}<button type="button" onclick={() => remove(p.slug)} class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">{t().admin.yesDelete}</button><button type="button" onclick={() => (confirming = null)} class="rounded-full border border-line px-3 py-1 text-xs font-bold">{t().admin.cancel}</button>{:else}<button type="button" onclick={() => (confirming = p.slug)} class="rounded-full border border-line px-3 py-1 text-xs font-bold hover:border-brand">{t().admin.delete}</button>{/if}</div></td></tr>{/each}</tbody>
			</table>
		</div>
		<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted"><span>{items.length} / {total}</span><span class="ml-auto flex items-center gap-2"><label class="flex items-center gap-1.5"><span>{t().admin.perPage}</span><select value={pageSize} onchange={(e) => setPageSize(Number((e.currentTarget as HTMLSelectElement).value))} class="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink">{#each PAGE_SIZES as s}<option value={s}>{s}</option>{/each}</select></label><button type="button" onclick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} class="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">{t().admin.prev}</button><span>{t().admin.page} {currentPage} {t().admin.of} {pageCount}</span><button type="button" onclick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount} class="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40">{t().admin.next}</button></span></div>
	{/if}
</section>
