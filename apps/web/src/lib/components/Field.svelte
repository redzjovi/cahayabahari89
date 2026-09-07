<script lang="ts">
	import type { Snippet } from 'svelte';
	import ReqMark from './ReqMark.svelte';

	let {
		label,
		required = false,
		hint = '',
		children
	}: {
		label: string;
		required?: boolean;
		hint?: string;
		children: Snippet;
	} = $props();
</script>

<!--
	Horizontal form row: stacked on mobile, label-left (180px, right-aligned)
	+ control-right on sm+. Used by all admin CRUD forms (login stays stacked).
-->
<label class="grid gap-1.5 text-sm font-semibold sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
	<span class="sm:text-right">
		{label}
		{#if required}
			<ReqMark />
		{/if}
		{#if hint}<span class="block text-xs font-normal normal-case tracking-normal text-muted">{hint}</span>{/if}
	</span>
	{@render children()}
</label>
