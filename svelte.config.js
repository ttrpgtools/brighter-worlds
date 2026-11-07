import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      config: process.env.BWO_PAGES_BUILD === '1' ? 'wrangler.pages.jsonc' : 'wrangler.jsonc',
      platformProxy: {
        configPath: './wrangler.jsonc',
        remoteBindings: false,
      },
    }),
    alias: {
      $data: 'src/data',
    },
  },
};

export default config;
