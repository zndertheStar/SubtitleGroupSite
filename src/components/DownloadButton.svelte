<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  
  export let url: string = '#';
  export let filename: string = 'download';
  export let size: string = '';
  export let type: 'subtitles' | 'fonts' = 'subtitles';
  export let note: string = '';
  
  let isHovered = false;
  let isDownloading = false;
  let copied = false;
  
  const isMagnet = url.startsWith('magnet:');
  
  async function handleDownload() {
    if (url === '#' || isDownloading) return;
    
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
      window.open(url, '_blank');
    } finally {
      setTimeout(() => {
        isDownloading = false;
      }, 1000);
    }
  }
  
  async function handleCopyMagnet() {
    if (!isMagnet) return;
    
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }
</script>

<div 
  class="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-primary-500/10 transition-all duration-300 border border-transparent hover:border-primary-500/20"
  role="button"
  tabindex="0"
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
>
  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0 transition-transform duration-300" class:scale-110={isHovered}>
    <span class="text-lg">{isMagnet ? '🧲' : type === 'subtitles' ? '📜' : '🔤'}</span>
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
  
  {#if isMagnet}
    <button 
      on:click={handleCopyMagnet}
      class="px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 flex items-center gap-2 transition-all duration-300 {copied ? 'bg-green-500/20 text-green-300' : 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'}"
    >
      {#if copied}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>已复制</span>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>复制磁链</span>
      {/if}
    </button>
  {:else}
    <button 
      on:click={handleDownload}
      class="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 transition-all duration-300 flex-shrink-0 flex items-center gap-2"
      class:opacity-50={isDownloading}
      disabled={isDownloading}
    >
      {#if isDownloading}
        <div class="w-4 h-4 border-2 border-primary-300 border-t-transparent rounded-full animate-spin"></div>
        <span>下载中</span>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>下载</span>
      {/if}
    </button>
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
