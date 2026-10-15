import { defineConfig } from 'astro/config';

// Pages deploy under /omnicon-products-web on GitHub Pages
export default defineConfig({
  site: 'https://diegopaz83.github.io',
  base: '/omnicon-products-web',
  trailingSlash: 'always',
});
