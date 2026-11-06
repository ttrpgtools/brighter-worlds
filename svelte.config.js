import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      ...(process.env.BWO_WORKER_BUILD === '1' ? { config: 'wrangler.worker.toml' } : {}),
      platformProxy: {
        configPath: './wrangler.worker.toml',
        remoteBindings: false,
      },
    }),
    alias: {
      $data: 'src/data',
    },
  },
};

export default config;
