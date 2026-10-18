import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red:      '#CC0000',
          dark:     '#8B0000',
          darker:   '#6B0000',
          light:    '#FFE5E5',
          lighter:  '#FFF5F5',
        },
        // Design system beOn Labs: Comunidade, login e moldura do portal
        beon: {
          red:   '#D31809',
          redhi: '#B31407',
          tint:  '#FDF1F0',
          ink:   '#1C1917',
          body:  '#44403C',
          muted: '#78716C',
          line:  '#E7E5E4',
          soft:  '#F7F6F4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
