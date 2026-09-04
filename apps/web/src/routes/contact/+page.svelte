<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import { enhance } from '$app/forms';
	let { form } = $props();

	const WA_NUMBER = '6287877118199';
	const waLink = `https://wa.me/${WA_NUMBER}?text=Hello%20Cahaya%20Bahari%2089`;
</script>

<svelte:head><title>Contact — Cahaya Bahari 89</title></svelte:head>

<section class="mx-auto max-w-6xl px-4 pb-8 pt-12">
	<SectionHead eyebrow={t().contact.eyebrow} title={t().contact.title} sub={t().contact.sub} />
	<div class="mt-8 grid gap-10 lg:grid-cols-5">
		<div use:reveal class="lg:col-span-3">
			{#if form?.ok}
				<p class="rounded-card bg-emerald-500/10 p-4 font-medium text-emerald-600">{t().contact.ok}</p>
			{/if}
			{#if form?.error}
				<p class="rounded-card bg-red-500/10 p-4 font-medium text-red-500">{t().contact.fail}</p>
			{/if}

			<form method="POST" use:enhance class="mt-2 grid gap-4 sm:grid-cols-2">
				<label class="grid gap-1.5 text-sm font-semibold">
					{t().contact.name}
					<input name="name" required minlength="2" class="rounded-card border px-4 py-3 font-normal" />
				</label>
				<label class="grid gap-1.5 text-sm font-semibold">
					{t().contact.company}
					<input name="company" class="rounded-card border px-4 py-3 font-normal" />
				</label>
				<label class="grid gap-1.5 text-sm font-semibold">
					{t().contact.email}
					<input name="email" type="email" required class="rounded-card border px-4 py-3 font-normal" />
				</label>
				<label class="grid gap-1.5 text-sm font-semibold">
					{t().contact.volume}
					<select name="volume" class="rounded-card border px-4 py-3 font-normal">
						{#each t().contact.volumes as v}
							<option value={v}>{v}</option>
						{/each}
					</select>
				</label>
				<label class="grid gap-1.5 text-sm font-semibold sm:col-span-2">
					{t().contact.message}
					<textarea name="message" required minlength="10" rows="5" class="rounded-card border px-4 py-3 font-normal"></textarea>
				</label>
				<div class="sm:col-span-2">
					<button type="submit" class="rounded-full bg-brand px-8 py-3.5 font-bold text-brand-ink transition hover:brightness-110">{t().contact.send}</button>
				</div>
			</form>
		</div>
		<aside use:reveal class="lg:col-span-2">
			<div class="rounded-card border border-line bg-surface p-7 shadow-card">
				<h3 class="font-display text-xl font-bold">Export Desk</h3>
				<ul class="mt-4 space-y-3 text-sm text-muted">
					<li><a href={waLink} target="_blank" rel="noreferrer" class="font-bold text-brand hover:underline">WhatsApp: +62 878-7711-8199</a></li>
					<li>sales@cahayabahari89.id</li>
					<li>Jakarta, Indonesia</li>
					<li>Mon–Sat, 07:00–17:00 WIB</li>
				</ul>
				<a href={waLink} target="_blank" rel="noreferrer" class="mt-6 block rounded-full bg-accent px-6 py-3 text-center font-bold text-accent-ink transition hover:brightness-110">{t().contact.direct}</a>
			</div>
		</aside>
	</div>
</section>
