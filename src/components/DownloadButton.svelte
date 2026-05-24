<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  
  export let url: string = '#';
  export let filename: string = 'download';
  export let size: string = '';
  export let type: 'subtitles' | 'fonts' = 'subtitles';
  export let note: string = '';
  
  let isHovered = false;
  let isDownloading = false;
  
  const isMagnet = url.startsWith('magnet:');
  
  async function handleDownload() {
    if (url === '#' || isDownloading) return;
    
    // Magnet links: open directly or copy
    if (isMagnet) {
      window.open(url, '_blank');
      return;
    }
    
    isDownloading = true;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error('Download error:', e);
      // Fallback: open in new tab
      window.open(url, '_blank');
    } finally {
      setTimeout(() => {
        isDownloading = false;
      }, 1000);
    }
  }
</script>

<div 
  class="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-purple-500/10 transition-all duration-300 border border-transparent hover:border-purple-500/20"
  role="button"
  tabindex="0"
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
>
  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 transition-transform duration-300" class:scale-110={isHovered}>
    <span class="text-lg">{type === 'subtitles' ? '📜' : '🔤'}</span>
  </div>
  <div class="flex-1 min-w-0">
    <div class="font-medium truncate text-sm">{filename}</div>
    {#if note}
      <div class="text-xs text-gray-500 mt-0.5">{note}</div>
    {/if}
    {#if size}
      <div class="text-xs text-gray-500">{size}</div>
    {/if}
  </div>
  <button 
    on:click={handleDownload}
    class="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all duration-300 flex-shrink-0 flex items-center gap-2"
    class:opacity-50={isDownloading}
    disabled={isDownloading}
  >
    {#if isDownloading}
      <div class="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
      <span>下载中</span>
    {:else}
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>下载</span>
    {/if}
  </button>
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
