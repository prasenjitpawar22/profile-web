/** @type {import('tailwindcss').Config} */
import { screens as _screens } from 'tailwindcss/defaultTheme'

export const content = [
  './src/pages/**/*.{js,ts,jsx,tsx}',
  './src/components/**/*.{js,ts,jsx,tsx}',
  './src/app/**/*.{js,ts,jsx,tsx}',
]
export const theme = {
  extend: {
    backgroundImage: {
      'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
    },
    colors: {
      'primary': '#8892B0',
      'secondary': '#00d4ff',
      'ternary': '#d3dbf3'
    },
    screens: {
      'xs': '360px',
      ..._screens,
    },
  },
}
export const plugins = []
