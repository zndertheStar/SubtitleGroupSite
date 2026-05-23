// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';

// Detect environment
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const isNode = process.env.NODE_ENV === 'production' && !isVercel;

// https://astro.build/config
export default defineConfig({
  site: 'https://green-tea-subs.vercel.app',
  output: 'static',
  adapter: isVercel 
    ? vercel({
        webAnalytics: {
          enabled: true,
        },
      }) 
    : isNode 
      ? node({ mode: 'standalone' })
      : undefined,
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [svelte()],
  i18n: {
    locales: ['zh', 'ja', 'en'],
    defaultLocale: 'zh',
    routing: {
      prefixDefaultLocale: false
    }
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  }
});
