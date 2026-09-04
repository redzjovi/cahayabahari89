<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';
</script>

<svelte:head>
	<title>About — Cahaya Bahari 89</title>
	<meta name="description" content="The story of Cahaya Bahari 89, premium salmon and fresh fish supplier." />
</svelte:head>

<section class="mx-auto max-w-6xl px-4 pb-8 pt-12">
	<SectionHead eyebrow={t().about.eyebrow} title={t().about.title} index="01" />
	<div class="mt-8 grid items-start gap-10 lg:grid-cols-2">
		<div use:reveal class="space-y-4 leading-relaxed text-muted">
			<p>{t().about.p1}</p>
			<p>{t().about.p2}</p>
		</div>
		<PhotoPlaceholder label="Our team & facility photo" aspect="aspect-[4/3]" />
	</div>
</section>

<section class="bg-band">
	<div class="mx-auto max-w-6xl px-4 py-14">
		<SectionHead title={locale.current === 'id' ? 'Perjalanan kami' : 'Our journey'} index="02" />
		<ol class="mt-6 grid gap-5 md:grid-cols-4">
			{#each t().about.milestones as m}
				<li use:reveal class="rounded-card border border-line bg-surface p-6 shadow-card">
					<span class="font-display text-2xl font-bold text-brand">{m.year}</span>
					<p class="mt-2 text-sm text-muted">{m.text}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

<section class="mx-auto max-w-6xl px-4 py-14">
	<div class="grid gap-5 md:grid-cols-3">
		{#each t().about.values as v}
			<div use:reveal class="rounded-card border border-line bg-surface p-7 shadow-card">
				<h3 class="font-display text-xl font-bold">{v.title}</h3>
				<p class="mt-2 text-muted">{v.text}</p>
			</div>
		{/each}
	</div>
</section>
