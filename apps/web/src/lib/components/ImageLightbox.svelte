<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { preview } from '$lib/preview.svelte';

	let closeBtn: HTMLButtonElement | null = $state(null);
	// Move keyboard focus into the dialog when it opens (a11y-friendly autofocus).
	$effect(() => {
		if (preview.current) closeBtn?.focus();
	});

	function onKeys(e: KeyboardEvent) {
		if (e.key === 'Escape') preview.close();
		else if (e.key === 'ArrowRight' && preview.total > 1) preview.next();
		else if (e.key === 'ArrowLeft' && preview.total > 1) preview.prev();
	}
</script>

<svelte:window onkeydown={onKeys} />

{#if preview.current}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
		<button type="button" aria-label="Close" onclick={() => preview.close()} class="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"></button>
		<figure class="relative w-full max-w-3xl overflow-hidden rounded-card border border-line bg-surface shadow-card">
			<div class="relative">
				<img src={preview.current.src} alt={preview.current.alt} class="max-h-[70vh] w-full bg-black/5 object-contain" />
				{#if preview.total > 1}
					<button type="button" onclick={() => preview.prev()} aria-label={t().detail.prevImage} class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-lg font-bold text-white transition hover:bg-black/80">‹</button>
					<button type="button" onclick={() => preview.next()} aria-label={t().detail.nextImage} class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-lg font-bold text-white transition hover:bg-black/80">›</button>
				{/if}
			</div>
			<button type="button" bind:this={closeBtn} onclick={() => preview.close()} aria-label="Close" class="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-sm font-bold text-white transition hover:bg-black/80">×</button>
			<figcaption class="flex items-center justify-between gap-3 px-4 py-2 text-sm text-muted">
				<span class="truncate">{preview.current.alt}</span>
				{#if preview.total > 1}
					<span class="shrink-0 font-bold tabular-nums" aria-live="polite">{preview.index + 1} / {preview.total}</span>
				{/if}
			</figcaption>
		</figure>
	</div>
{/if}
