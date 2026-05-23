<script lang="ts">
  import { fly } from 'svelte/transition';
  
  let isDark = true;
  let isAnimating = false;
  
  // Initialize from document
  if (typeof document !== 'undefined') {
    isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  }
  
  function toggleTheme() {
    if (isAnimating) return;
    isAnimating = true;
    
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    isDark = next === 'dark';
    
    setTimeout(() => {
      isAnimating = false;
    }, 300);
  }
</script>

<button 
  on:click={toggleTheme}
  class="p-2 rounded-lg hover:bg-purple-500/10 transition-colors text-muted relative w-9 h-9 flex items-center justify-center"
  aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
>
  {#if isDark}
    <span in:fly={{ y: -10, duration: 200 }} out:fly={{ y: 10, duration: 200 }}>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </span>
  {:else}
    <span in:fly={{ y: -10, duration: 200 }} out:fly={{ y: 10, duration: 200 }}>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </span>
  {/if}
</button>
