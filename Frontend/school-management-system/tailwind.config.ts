import type { Config } from 'tailwindcss';

function withOpacity(variableName: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
    }
    return `var(${variableName})`;
  };
}

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: withOpacity('--color-brand-50'),
          100: withOpacity('--color-brand-100'),
          200: withOpacity('--color-brand-200'),
          300: withOpacity('--color-brand-300'),
          400: withOpacity('--color-brand-400'),
          500: withOpacity('--color-brand-500'),
          600: withOpacity('--color-brand-600'),
          700: withOpacity('--color-brand-700'),
          800: withOpacity('--color-brand-800'),
          900: withOpacity('--color-brand-900'),
          950: withOpacity('--color-brand-950'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

export default config;
