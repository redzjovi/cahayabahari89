<script lang="ts">
	import { locale, type Locale } from '$lib/locale.svelte';
	import { onMount } from 'svelte';

	onMount(() => locale.init());

	function pick(l: Locale) {
		locale.set(l);
	}
</script>

<div class="flex items-center rounded-full border border-line bg-surface p-1 text-xs font-bold" role="group" aria-label="Language / Bahasa">
	{#each [{ id: 'en', label: 'EN' }, { id: 'id', label: 'ID' }] as l}
		<button
			type="button"
			aria-pressed={locale.current === l.id}
			onclick={() => pick(l.id as Locale)}
			class="rounded-full px-2.5 py-1 transition {locale.current === l.id ? 'bg-brand text-brand-ink' : 'text-muted hover:text-ink'}"
		>{l.label}</button>
	{/each}
</div>
