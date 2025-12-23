import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        watermelon: {
          DEFAULT: '#ff4757'
        },
        melon: {
          DEFAULT: '#2ed573'
        }
      },
      borderRadius: {
        'xl': '1.25rem'
      }
    }
  },
  plugins: []
}

export default config
