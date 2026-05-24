<script lang="ts">
  import { onMount } from 'svelte';
  
  let searchQuery = '';
  let searchResults: any[] = [];
  let pagefind: any = null;
  let isSearching = false;
  
  onMount(async () => {
    try {
      const pagefindModule = await import('/pagefind/pagefind.js');
      pagefind = await pagefindModule.default?.init?.() || pagefindModule;
    } catch (e) {
      console.log('Pagefind not ready yet');
    }
  });
  
  async function handleSearch() {
    if (!pagefind || !searchQuery.trim()) {
      searchResults = [];
      return;
    }
    
    isSearching = true;
    try {
      const results = await pagefind.search(searchQuery);
      searchResults = results.results || [];
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      isSearching = false;
    }
  }
  
  function debounce(fn: Function, ms: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  }
  
  const debouncedSearch = debounce(handleSearch, 300);
  
  $: if (searchQuery) {
    debouncedSearch();
  } else {
    searchResults = [];
  }
</script>

<div class="relative w-full max-w-md">
  <div class="relative">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="搜索作品..."
      class="w-full px-4 py-2 pl-10 rounded-full search-input border focus:outline-none transition-all focus:w-[120%] focus:-translate-x-[8.33%]"
    />
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    {#if isSearching}
      <div class="absolute right-3 top-1/2 -translate-y-1/2">
        <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {/if}
  </div>
  
  {#if searchResults.length > 0}
    <div class="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-xl bg-surface border-theme z-50 max-h-96 overflow-y-auto">
      {#each searchResults as result}
        <a href={result.url} class="block p-3 hover:bg-primary-500/10 transition-colors border-b border-theme last:border-0">
          <div class="font-medium text-sm text-theme">{result.meta?.title || 'Untitled'}</div>
          <div class="text-xs text-muted mt-1 line-clamp-2">{@html result.excerpt || ''}</div>
        </a>
      {/each}
    </div>
  {:else if searchQuery && !isSearching}
    <div class="absolute top-full left-0 right-0 mt-2 rounded-xl border p-4 text-center text-sm text-muted bg-surface border-theme z-50">
      未找到相关作品
    </div>
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
