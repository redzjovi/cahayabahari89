<script lang="ts">
	import { localize } from '$lib/routes';
	import { locale } from '$lib/locale.svelte';
	import SeaCreature from '$lib/components/SeaCreature.svelte';

	type Fish = {
		id: string;
		en: string;
		id_name: string;
		latin: string;
		info_en: string;
		info_id: string;
		shape: 'fish' | 'tuna' | 'mackerel' | 'squid' | 'shrimp' | 'snail' | 'conch';
		top: string;
		duration: string;
		delay: string;
		size: string;
		color: string;
	};

	const FISH: Fish[] = [
		{ id: 'salmon', en: 'Salmon', id_name: 'Salmon', latin: 'Salmo salar', info_en: 'Rich, oily fish. Great grilled or as sashimi. High in omega-3.', info_id: 'Ikan berlemak, enak dibakar atau sashimi. Kaya omega-3.', shape: 'fish', top: '18%', duration: '70s', delay: '0s', size: 'h-8 w-10', color: 'text-accent-strong' },
		{ id: 'kakap', en: 'White Snapper', id_name: 'Kakap Putih', latin: 'Lates calcarifer', info_en: 'Firm white flesh, mild taste. Great steamed.', info_id: 'Daging putih padat, rasa ringan. Enak dikukus.', shape: 'fish', top: '30%', duration: '90s', delay: '-18s', size: 'h-7 w-9', color: 'text-brand' },
		{ id: 'gindara', en: 'Butterfish', id_name: 'Gindara', latin: 'Lepidocybium flavobrunneum', info_en: 'Buttery, soft flesh. Best grilled in small portions.', info_id: 'Daging lembut seperti mentega. Terbaik dibakar.', shape: 'fish', top: '42%', duration: '80s', delay: '-40s', size: 'h-7 w-9', color: 'text-muted' },
		{ id: 'tenggiri', en: 'Mackerel', id_name: 'Tenggiri', latin: 'Scomberomorus', info_en: 'Firm, savory fish. Popular for otak-otak and fried slices.', info_id: 'Daging padat gurih. Populer untuk otak-otak dan goreng.', shape: 'mackerel', top: '54%', duration: '65s', delay: '-10s', size: 'h-8 w-10', color: 'text-brand' },
		{ id: 'tuna', en: 'Tuna', id_name: 'Tuna', latin: 'Thunnus sp.', info_en: 'Meaty and protein-rich. Great seared or grilled.', info_id: 'Daging tebal kaya protein. Enak dibakar.', shape: 'tuna', top: '24%', duration: '100s', delay: '-60s', size: 'h-9 w-12', color: 'text-accent-strong' },
		{ id: 'dori', en: 'Dory', id_name: 'Dori', latin: 'Pangasius sp.', info_en: 'Soft white fillet, mild. Great for fish & chips.', info_id: 'Fillet putih lembut. Cocok untuk fish & chips.', shape: 'fish', top: '60%', duration: '85s', delay: '-30s', size: 'h-6 w-8', color: 'text-muted' },
		{ id: 'cumi', en: 'Baby Squid', id_name: 'Baby Cumi', latin: 'Loligo sp.', info_en: 'Tender and quick to cook. Great fried or with sambal.', info_id: 'Empuk, cepat dimasak. Enak digoreng atau sambal.', shape: 'squid', top: '36%', duration: '55s', delay: '-50s', size: 'h-6 w-8', color: 'text-accent-strong' },
		{ id: 'udang', en: 'Shrimp', id_name: 'Udang', latin: 'Litopenaeus vannamei', info_en: 'Sweet and springy. Great boiled, grilled, or fried.', info_id: 'Manis kenyal. Enak direbus, dibakar, atau digoreng.', shape: 'shrimp', top: '48%', duration: '75s', delay: '-70s', size: 'h-6 w-8', color: 'text-brand' },
		{ id: 'siput', en: 'Sea Snail', id_name: 'Siput', latin: 'Gastropoda', info_en: 'Chewy sea snail. Best boiled with spicy dip.', info_id: 'Siput laut kenyal. Enak direbus dengan sambal.', shape: 'snail', top: '66%', duration: '110s', delay: '-25s', size: 'h-6 w-8', color: 'text-muted' },
		{ id: 'gonggong', en: 'Dog Conch', id_name: 'Gonggong', latin: 'Laevistrombus canarium', info_en: 'Batam specialty sea snail. Boiled, eaten with chili.', info_id: 'Siput khas Batam. Direbus, dimakan dengan sambal.', shape: 'conch', top: '72%', duration: '120s', delay: '-80s', size: 'h-6 w-8', color: 'text-accent-strong' }
	];

	let selected = $state<string | null>(null);
	const selectedFish = $derived(FISH.find((f) => f.id === selected) ?? null);
	const isId = $derived(locale.current === 'id');
</script>

<svelte:head><title>404 — Cahaya Bahari 89</title></svelte:head>

<div class="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
	<!-- Swimming creatures (clickable). Outer div swims, inner button scales — kept separate so hover never fights the swim transform. -->
	<div class="absolute inset-0" aria-hidden="false">
		{#each FISH as f}
			<div
				class="anim-swim group absolute left-0 group-hover:[animation-play-state:paused]"
				style="top: {f.top}; animation-duration: {f.duration}; animation-delay: {f.delay};"
			>
				<button
					type="button"
					onclick={() => (selected = f.id)}
					aria-label={isId ? f.id_name : f.en}
					class="flex flex-col items-center gap-1 rounded-lg p-3 transition hover:scale-110"
				>
					<SeaCreature kind={f.shape} cls="{f.size} {f.color} opacity-40" />
					<span class="rounded-full border border-line bg-surface/90 px-2 py-0.5 text-[10px] font-bold text-muted">{isId ? f.id_name : f.en}</span>
				</button>
			</div>
		{/each}
	</div>

	<!-- Content -->
	<p class="font-display text-[8rem] font-bold leading-none text-brand opacity-20 sm:text-[10rem]">404</p>
	<h1 class="mt-2 font-display text-2xl font-bold sm:text-3xl">{isId ? 'Halaman tidak ditemukan' : 'Page not found'}</h1>
	<p class="mt-3 max-w-md text-muted">
		{isId
			? 'Halaman yang kamu cari tidak ada. Klik salah satu ikan di laut ini untuk kenalan!'
			: 'The page you are looking for does not exist. Click a fish swimming by to meet it!'}
	</p>
	<a href={localize('/', locale.current)} class="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-bold text-brand-ink transition hover:brightness-110">
		{isId ? 'Kembali ke beranda' : 'Back to home'}
	</a>

	<!-- Ocean wave -->
	<svg class="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" style="height: 80px;" aria-hidden="true">
		<path d="M0 60 Q 180 0 360 60 T 720 60 T 1080 60 T 1440 60 V120 H0 Z" fill="var(--band)" />
	</svg>
	<div class="absolute bottom-0 left-0 right-0 h-16 bg-band" aria-hidden="true"></div>
</div>

<!-- Fish info modal -->
{#if selectedFish}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button type="button" aria-label="Close" onclick={() => (selected = null)} class="absolute inset-0 bg-black/40 backdrop-blur-sm"></button>
		<div class="relative w-full max-w-sm rounded-card border border-line bg-surface p-5 text-left shadow-card">
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.14em] text-brand">{selectedFish.latin}</p>
					<h2 class="mt-1 font-display text-xl font-bold">{isId ? selectedFish.id_name : selectedFish.en}</h2>
				</div>
				<button type="button" onclick={() => (selected = null)} aria-label="Close" class="rounded-full border border-line px-2.5 py-1 text-sm font-bold text-muted transition hover:border-brand hover:text-brand">×</button>
			</div>
			<div class="mt-3 flex items-center gap-3 rounded-card bg-band/60 p-3">
				<SeaCreature kind={selectedFish.shape} cls="h-10 w-12 {selectedFish.color}" />
				<p class="text-sm leading-relaxed text-muted">{isId ? selectedFish.info_id : selectedFish.info_en}</p>
			</div>
			<div class="mt-4 flex gap-2">
				<a href={localize('/products', locale.current)} class="flex-1 rounded-full bg-brand px-4 py-2 text-center text-sm font-bold text-brand-ink transition hover:brightness-110">
					{isId ? 'Lihat Katalog' : 'Browse Products'}
				</a>
				<button type="button" onclick={() => (selected = null)} class="rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-brand">
					{isId ? 'Tutup' : 'Close'}
				</button>
			</div>
		</div>
	</div>
{/if}
