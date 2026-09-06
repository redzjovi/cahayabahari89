<script lang="ts">
	import { locale, type Locale } from '$lib/locale.svelte';
	import { switchLocale } from '$lib/routes';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	function pick(l: Locale) {
		if (l === locale.current) return;
		goto(switchLocale(page.url.pathname, page.url.search, l));
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
