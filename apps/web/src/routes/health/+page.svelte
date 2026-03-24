<script lang="ts">
	let { data } = $props();
</script>

<main>
	<h1>Web health</h1>
	<p>Status: {data.status}</p>
	<p>Service: {data.service}</p>
</main>
