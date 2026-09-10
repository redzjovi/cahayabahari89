<script lang="ts">
	import { t, locale } from '$lib/locale.svelte';
	import { reveal } from '$lib/reveal';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import { buildInquiryWhatsAppLink } from '$lib/cart.svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	let { form } = $props();
	let submitting = $state(false);
	let waUrl = $state('');

	let fName = $state('');
	let fCompany = $state('');
	let fEmail = $state('');
	let fMessage = $state('');

	const WA_NUMBER = '6287877118199';
	const waLink = `https://wa.me/${WA_NUMBER}?text=Hello%20Cahaya%20Bahari%2089`;
	const EMAIL = 'sales@cahayabahari89.id';

	const handleSubmit: SubmitFunction = ({ formData }) => {
		submitting = true;
		waUrl = '';
		// Snapshot BEFORE update(): on success SvelteKit resets the <form>,
		// which clears the bound inputs — reading them after would send blanks.
		const snapshot = {
			name: String(formData.get('name') ?? ''),
			company: String(formData.get('company') ?? ''),
			email: String(formData.get('email') ?? ''),
			volume: String(formData.get('volume') ?? ''),
			message: String(formData.get('message') ?? '')
		};
		return async ({ result, update }) => {
			await update();
			submitting = false;
			// Lead saved → open WhatsApp with the inquiry prefilled.
			// (Popup blockers may stop this; the success box links it manually.)
			if (result.type === 'success') {
				waUrl = buildInquiryWhatsAppLink(snapshot, locale.current);
				window.open(waUrl, '_blank', 'noopener');
			}
		};
	};
</script>

<svelte:head><title>{locale.current === 'id' ? 'Kontak' : 'Contact'} — Cahaya Bahari 89</title></svelte:head>

<section data-section="contact-channels" class="content-wrap pb-8 pt-8">
	<SectionHead eyebrow={t().contact.eyebrow} title="" />
	<div class="mt-8 grid gap-5 sm:grid-cols-2">
		<a
			href={waLink}
			target="_blank"
			rel="noreferrer"
			use:reveal
			class="lift flex items-center gap-4 rounded-card border border-line bg-surface p-5 shadow-card transition hover:border-brand"
		>
			<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong" aria-hidden="true">
				<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none"><path d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5 0 1.5.4 3 1.1 4.3L3.5 20.5l4.3-1.1c1.3.7 2.7 1.1 4.2 1.1 4.7 0 8.5-3.8 8.5-8.5s-3.8-8.5-8.5-8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><circle cx="9" cy="12" r="1.1" fill="currentColor" /><circle cx="12.2" cy="12" r="1.1" fill="currentColor" /><circle cx="15.4" cy="12" r="1.1" fill="currentColor" /></svg>
			</span>
			<span>
				<span class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">WhatsApp</span>
				<span class="mt-1 block font-display text-base font-bold hover:text-brand md:text-xl">+62 878-7711-8199</span>
				<span class="mt-1 block text-sm text-muted">Mon–Sat, 07:00–17:00 WIB</span>
			</span>
		</a>
		<a
			href="mailto:{EMAIL}"
			use:reveal
			class="lift flex items-center gap-4 rounded-card border border-line bg-surface p-5 shadow-card transition hover:border-brand"
		>
			<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong" aria-hidden="true">
				<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8" /><path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</span>
			<span>
				<span class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">Email</span>
				<span class="mt-1 block font-display text-base font-bold hover:text-brand md:text-xl">{EMAIL}</span>
				<span class="mt-1 block text-sm text-muted">{locale.current === 'id' ? 'Balasan maks. 1 hari kerja' : 'Replies within 1 business day'}</span>
			</span>
		</a>
	</div>
</section>

<section data-section="inquiry-form" class="mx-auto max-w-3xl px-4 py-6">
	<SectionHead title={t().contact.send} />
	<div use:reveal class="mt-6">
		{#if form?.ok}
			<p class="animate-pop rounded-card bg-emerald-500/10 p-4 font-medium text-emerald-600">
				{t().contact.ok}
				{#if waUrl}
					<a href={waUrl} target="_blank" rel="noreferrer" class="ml-2 underline">WhatsApp ↗</a>
				{/if}
			</p>
		{/if}
		{#if form?.error}
			<p class="animate-pop rounded-card bg-red-500/10 p-4 font-medium text-red-500">{t().contact.fail}</p>
		{/if}

		<form method="POST" use:enhance={handleSubmit} class="mt-2 grid gap-3 sm:grid-cols-2">
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.name}
				<input name="name" bind:value={fName} required minlength="2" class="rounded-card border px-4 py-2.5 font-normal" />
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.company}
				<input name="company" bind:value={fCompany} class="rounded-card border px-4 py-2.5 font-normal" />
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.email}
				<input name="email" type="email" bind:value={fEmail} required class="rounded-card border px-4 py-2.5 font-normal" />
			</label>
			<label class="grid gap-1.5 text-sm font-semibold">
				{t().contact.volume}
				<select name="volume" class="rounded-card border px-4 py-2.5 font-normal">
					{#each t().contact.volumes as v}
						<option value={v}>{v}</option>
					{/each}
				</select>
			</label>
			<label class="grid gap-1.5 text-sm font-semibold sm:col-span-2">
				{t().contact.message}
				<textarea name="message" bind:value={fMessage} required minlength="10" rows="5" class="rounded-card border px-4 py-2.5 font-normal"></textarea>
			</label>
		<div class="sm:col-span-2">
				<button type="submit" disabled={submitting} class="rounded-full bg-brand px-6 py-2.5 font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-60">
					{#if submitting}
						<span class="inline-flex items-center gap-2">
							<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
							{t().contact.send}…
						</span>
					{:else}
						{t().contact.send}
					{/if}
				</button>
				<p class="mt-2 text-xs text-muted">{t().contact.direct}</p>
		</div>
		</form>
	</div>
</section>
