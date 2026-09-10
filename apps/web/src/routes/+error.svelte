<script lang="ts">
	import { page } from '$app/state';
	import { localize } from '$lib/routes';
	import { locale } from '$lib/locale.svelte';

	const isId = $derived(locale.current === 'id');
	const code = $derived(page.status ?? 404);
	const errMsg = $derived(page.error?.message ?? '');
</script>

<svelte:head><title>{code} — Cahaya Bahari 89</title></svelte:head>

<div class="flex min-h-[80vh] flex-col items-center justify-center px-4 py-10 text-center">
	<p class="font-display text-[5rem] font-bold leading-none text-brand opacity-20 select-none sm:text-[7rem]">{code}</p>
	<h1 class="mt-2 font-display text-2xl font-bold sm:text-3xl">
		{isId ? 'Halaman tidak ditemukan' : 'Page not found'}
	</h1>
	<p class="mt-3 max-w-md text-muted">
		{isId
			? 'Halaman yang kamu cari tidak ada.'
			: 'The page you are looking for does not exist.'}
	</p>
	{#if code !== 404 && errMsg}
		<p class="mt-2 max-w-md text-xs text-muted">({errMsg})</p>
	{/if}
	<div class="mt-6 flex flex-wrap justify-center gap-2">
		<a href={localize('/', locale.current)} class="rounded-full bg-brand px-6 py-3 font-bold text-brand-ink transition hover:brightness-110">
			{isId ? 'Kembali ke beranda' : 'Back to home'}
		</a>
		<a href={localize('/products', locale.current)} class="rounded-full border border-line px-6 py-3 font-bold transition hover:border-brand">
			{isId ? 'Lihat Katalog' : 'Browse Products'}
		</a>
	</div>
</div>
