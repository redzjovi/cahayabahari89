<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import { preview } from '$lib/preview.svelte';

	export type GridImage = { id: number; url: string; alt: string | null };
	export type GridPending = { url: string; name: string };

	let {
		images = [],
		pending = [],
		busy = false,
		nameFallback = '',
		onPick,
		onUnstage,
		onRemove,
		onMovePersisted,
		onMovePending,
		onDropPersisted,
		onDropPending
	}: {
		images?: GridImage[];
		pending?: GridPending[];
		busy?: boolean;
		nameFallback?: string;
		onPick: (files: FileList) => void;
		onUnstage: (index: number) => void;
		onRemove: (id: number) => void;
		onMovePersisted?: (index: number, dir: -1 | 1) => void;
		onMovePending?: (index: number, dir: -1 | 1) => void;
		onDropPersisted?: (from: number, to: number) => void;
		onDropPending?: (from: number, to: number) => void;
	} = $props();

	let fileInput: HTMLInputElement | null = $state(null);
	let dragKind = $state<'persisted' | 'pending' | null>(null);
	let dragIndex = $state<number | null>(null);
	let dropIndex = $state<number | null>(null);

	function handleFiles() {
		if (fileInput?.files?.length) onPick(fileInput.files);
		if (fileInput) fileInput.value = '';
	}

	function dragStart(kind: 'persisted' | 'pending', index: number, e: DragEvent) {
		if (busy) {
			e.preventDefault();
			return;
		}
		dragKind = kind;
		dragIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			try {
				e.dataTransfer.setData('text/plain', `${kind}:${index}`);
			} catch {
				// some browsers restrict setData — local state is the source of truth
			}
		}
	}

	function dragOver(index: number, e: DragEvent) {
		if (!dragKind || dragIndex === null || busy) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dropIndex = index;
	}

	function drop(kind: 'persisted' | 'pending', index: number, e: DragEvent) {
		e.preventDefault();
		if (!dragKind || dragIndex === null || busy) return;
		if (dragKind !== kind || dragIndex === index) {
			resetDrag();
			return;
		}
		if (kind === 'persisted') onDropPersisted?.(dragIndex, index);
		else onDropPending?.(dragIndex, index);
		resetDrag();
	}

	function resetDrag() {
		dragKind = null;
		dragIndex = null;
		dropIndex = null;
	}
</script>

<span class="grid gap-2">
	<span class="flex flex-wrap gap-2">
		{#each images as img, i (img.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions: tile drag is pointer-supplementary; keyboard reorder uses the ←/→ buttons inside -->
			<span
				draggable={!busy}
				ondragstart={(e) => dragStart('persisted', i, e)}
				ondragover={(e) => dragOver(i, e)}
				ondrop={(e) => drop('persisted', i, e)}
				ondragend={resetDrag}
				class="relative inline-block h-24 w-24 cursor-grab overflow-hidden rounded-lg border border-line bg-band active:cursor-grabbing {dropIndex ===
					i && dragKind === 'persisted'
					? 'border-brand ring-2 ring-brand'
					: ''} {dragIndex === i && dragKind === 'persisted' ? 'opacity-50' : ''}"
			>
				{#if img.url}
					<button
						type="button"
						onclick={() => preview.open(img.url, img.alt ?? nameFallback)}
						aria-label={img.alt ?? nameFallback}
						class="block h-full w-full transition hover:opacity-90"
					>
						<img src={img.url} alt={img.alt ?? ''} class="h-full w-full object-cover" loading="lazy" draggable={false} />
					</button>
				{:else}<span class="flex h-full w-full items-center justify-center text-[10px] text-accent-strong">no url</span>{/if}
				{#if i === 0}
					<span class="absolute left-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">{t().admin.cover}</span>
				{/if}
				<button
					type="button"
					onclick={() => onRemove(img.id)}
					disabled={busy}
					aria-label={t().admin.removeImage}
					class="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white disabled:opacity-50"
				>×</button>
				<span class="absolute bottom-1 left-1 flex gap-1">
					<button
						type="button"
						onclick={() => onMovePersisted?.(i, -1)}
						disabled={busy || i === 0}
						aria-label={t().admin.moveLeft}
						class="rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white disabled:opacity-30"
					>←</button>
					<button
						type="button"
						onclick={() => onMovePersisted?.(i, 1)}
						disabled={busy || i === images.length - 1}
						aria-label={t().admin.moveRight}
						class="rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white disabled:opacity-30"
					>→</button>
				</span>
			</span>
		{/each}
		{#each pending as p, i (p.url)}
			<!-- svelte-ignore a11y_no_static_element_interactions: tile drag is pointer-supplementary; keyboard reorder uses the ←/→ buttons inside -->
			<span
				draggable={!busy}
				ondragstart={(e) => dragStart('pending', i, e)}
				ondragover={(e) => dragOver(i, e)}
				ondrop={(e) => drop('pending', i, e)}
				ondragend={resetDrag}
				class="relative inline-block h-24 w-24 cursor-grab overflow-hidden rounded-lg border border-dashed border-brand bg-band active:cursor-grabbing {dropIndex ===
					i && dragKind === 'pending'
					? 'ring-2 ring-brand'
					: ''} {dragIndex === i && dragKind === 'pending' ? 'opacity-50' : ''}"
			>
				<button
					type="button"
					onclick={() => preview.open(p.url, p.name)}
					aria-label={p.name}
					class="block h-full w-full transition hover:opacity-90"
				>
					<img src={p.url} alt={p.name} class="h-full w-full object-cover" loading="lazy" draggable={false} />
				</button>
				<span class="absolute left-1 top-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-ink">{t().admin.pending}</span>
				<button
					type="button"
					onclick={() => onUnstage(i)}
					disabled={busy}
					aria-label={t().admin.removeImage}
					class="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white disabled:opacity-50"
				>×</button>
				<span class="absolute bottom-1 left-1 flex gap-1">
					<button
						type="button"
						onclick={() => onMovePending?.(i, -1)}
						disabled={busy || i === 0}
						aria-label={t().admin.moveLeft}
						class="rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white disabled:opacity-30"
					>←</button>
					<button
						type="button"
						onclick={() => onMovePending?.(i, 1)}
						disabled={busy || i === pending.length - 1}
						aria-label={t().admin.moveRight}
						class="rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white disabled:opacity-30"
					>→</button>
				</span>
			</span>
		{/each}
		<button
			type="button"
			onclick={() => fileInput?.click()}
			disabled={busy}
			aria-label={t().admin.addImage}
			class="flex h-24 w-24 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-brand font-bold text-brand transition hover:bg-brand/10 disabled:opacity-50"
		>
			<span class="text-2xl leading-none">+</span>
			<span class="px-1 text-center text-[11px] leading-tight">{t().admin.addImage}</span>
		</button>
	</span>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/jpeg,image/png,image/webp,image/avif"
		multiple
		onchange={handleFiles}
		disabled={busy}
		class="hidden"
	/>
	<span class="text-xs font-normal text-muted">{t().admin.reorderHint} {t().admin.uploadHint}</span>
	{#if pending.length}<span class="text-xs font-bold text-brand">{pending.length} × {t().admin.pending.toLowerCase()}</span>{/if}
</span>
