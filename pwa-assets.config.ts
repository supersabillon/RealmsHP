import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimalPreset,
    maskable: {
      ...minimalPreset.maskable,
      padding: 0.3,
      resizeOptions: { background: '#020c1a', fit: 'contain' },
    },
    apple: {
      ...minimalPreset.apple,
      padding: 0.2,
      resizeOptions: { background: '#020c1a', fit: 'contain' },
    },
  },
  images: ['public/icon.svg'],
})
