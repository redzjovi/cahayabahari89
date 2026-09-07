<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import PhotoPlaceholder from '$lib/components/PhotoPlaceholder.svelte';
</script>

<svelte:head>
	<title>{locale.current === 'id' ? 'Tentang Kami' : 'About Us'} — Cahaya Bahari 89</title>
	<meta name="description" content={t().about.p1.slice(0, 150)} />
</svelte:head>

<!-- OUR STORY -->
<section class="content-wrap py-6">
	<SectionHead eyebrow={t().about.eyebrow} title={t().about.title} />
	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
		<div use:reveal class="space-y-4 leading-relaxed text-muted">
			<p>{t().about.p1}</p>
			<p>{t().about.p2}</p>
		</div>
		<PhotoPlaceholder label="Our team & facility photo" aspect="aspect-[4/3]" />
	</div>
</section>

<!-- OUR JOURNEY + VALUES -->
<section class="bg-band">
	<div class="content-wrap py-10">
		<SectionHead title={locale.current === 'id' ? 'Perjalanan kami' : 'Our journey'} />
		<ol class="mt-6 grid gap-4 md:grid-cols-4">
			{#each t().about.milestones as m}
				<li use:reveal class="rounded-card border border-line bg-surface p-4 shadow-card">
					<span class="font-display text-2xl font-bold text-brand">{m.year}</span>
					<p class="mt-2 text-sm text-muted">{m.text}</p>
				</li>
			{/each}
		</ol>
		<div class="mt-6 grid gap-4 md:grid-cols-3">
			{#each t().about.values as v}
				<div use:reveal class="rounded-card border border-line bg-surface p-5 shadow-card">
					<h3 class="font-display text-xl font-bold">{v.title}</h3>
					<p class="mt-2 text-muted">{v.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
