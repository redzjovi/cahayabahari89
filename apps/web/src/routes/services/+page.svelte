<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';
</script>

<svelte:head>
	<title>Quality & Export — Cahaya Bahari 89</title>
	<meta name="description" content="Export-grade quality control and sustainable salmon sourcing at Cahaya Bahari 89." />
</svelte:head>

<section class="mx-auto max-w-6xl px-4 pb-8 pt-12">
	<SectionHead eyebrow={t().qualityPage.eyebrow} title={t().qualityPage.title} index="01" />
	<div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#each t().qualityPage.steps as s}
			<div use:reveal class="rounded-card border border-line bg-surface p-6 shadow-card">
				<h3 class="font-display text-lg font-bold text-brand">{s.title}</h3>
				<p class="mt-2 text-sm text-muted">{s.text}</p>
			</div>
		{/each}
	</div>
</section>

<section class="bg-band">
	<div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2">
		<PhotoPlaceholder label="Cold-chain facility photo" aspect="aspect-[4/3]" />
		<div use:reveal>
			<span class="text-xs font-bold uppercase tracking-[0.18em] text-brand">02</span>
			<h2 class="mt-2 font-display text-3xl font-bold tracking-tight">{t().qualityPage.sustain.title}</h2>
			<p class="mt-3 leading-relaxed text-muted">{t().qualityPage.sustain.text}</p>
			<a href="/contact" class="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-bold text-brand-ink transition hover:brightness-110">{t().cta.button}</a>
		</div>
	</div>
</section>
