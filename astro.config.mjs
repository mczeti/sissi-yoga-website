// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { storyblok } from '@storyblok/astro';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    storyblok({
      accessToken: import.meta.env.STORYBLOK_TOKEN,
      components: {
        flyer: 'components/storyblok/Flyer',
      },
    })
  ]
});