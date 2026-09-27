/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1. Deep Navy palette (Primary Dark / Text / Sidebar / Elevated Surfaces)
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#627D98',
          500: '#334E68',
          600: '#243B53',
          700: '#182C42',
          800: '#102030',
          900: '#0B1524',
          950: '#070D18',
        },
        // 2. Pine Emerald palette (Primary Brand Accent / CTAs / Highlights / Glow - #05775A)
        amber: {
          50: '#E6F7F2',
          100: '#C2EDE1',
          200: '#8BDBC4',
          300: '#4EC5A4',
          400: '#1EAD86',
          500: '#0E946E',
          600: '#05775A', // User specified brand accent
          700: '#045F48',
          800: '#034938',
          900: '#023428',
          950: '#011E17',
        },
        gold: {
          50: '#E6F7F2',
          100: '#C2EDE1',
          200: '#8BDBC4',
          300: '#4EC5A4',
          400: '#1EAD86',
          500: '#0E946E',
          600: '#05775A',
          700: '#045F48',
          800: '#034938',
          900: '#023428',
        },
        // 3. Warm Beige palette (Canvas / Background / Borders / Dividers)
        beige: {
          50: '#FAF8F5',
          100: '#F4EFEA',
          200: '#E8DFD5',
          300: '#D8CCC0',
          400: '#C2B4A3',
          500: '#A89682',
          600: '#8C7A67',
          700: '#706050',
          800: '#56493D',
          900: '#3D332B',
        },
        // Harmonized brand alias (Exact Brand Color Palette - Light Theme)
        brand: {
          'primary-bg': '#F8FAFC',
          'secondary-bg': '#FFFFFF',
          'primary-text': '#334155',
          'secondary-text': '#64748B',
          'primary-accent': '#0D9488',
          'hover-accent': '#0F766E',
          'borders': '#E2E8F0',
          'cards': '#FFFFFF',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#334155',
          900: '#1E293B',
          950: '#0F172A',
        },
        // Harmonize slate to bridge Light Theme (Alabaster & Slate Gray) & Deep Navy (dark)
        slate: {
          50: '#F8FAFC',   // Canvas off-white / alabaster (60%)
          100: '#F1F5F9',  // Subtle container
          200: '#E2E8F0',  // Subtle slate border
          300: '#CBD5E1',  // Divider / input border
          400: '#94A3B8',  // Placeholder / muted text
          500: '#64748B',  // Slate Gray secondary text
          600: '#475569',  // Slate medium text
          700: '#233752',  // Deep navy subtle (Dark theme compatibility)
          800: '#132238',  // Deep navy surface (Dark theme compatibility)
          900: '#0B1524',  // Deep navy primary (Dark theme compatibility)
          950: '#070D18',  // Deep navy midnight (Dark theme compatibility)
        },
        // Harmonize sky to Teal Accent for complete system-wide button and focus ring theme
        sky: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(5, 119, 90, 0.25)',
        'gold-lg': '0 10px 25px -3px rgba(5, 119, 90, 0.3)',
        'gold-glow': '0 0 20px 2px rgba(5, 119, 90, 0.45)',
        'gold-glow-lg': '0 0 35px 5px rgba(5, 119, 90, 0.6)',
        'navy': '0 4px 20px 0 rgba(11, 21, 36, 0.12)',
        'navy-lg': '0 12px 30px -4px rgba(11, 21, 36, 0.25)',
        'cyan-glow': '0 0 20px 2px rgba(6, 182, 212, 0.4)',
        'emerald-glow': '0 0 20px 2px rgba(16, 185, 129, 0.4)',
        'hologram': '0 0 25px rgba(5, 119, 90, 0.15), inset 0 0 15px rgba(5, 119, 90, 0.1)',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(5, 119, 90, 0.6))' },
          '50%': { opacity: '0.65', filter: 'drop-shadow(0 0 2px rgba(5, 119, 90, 0.2))' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        radarSweep: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '50%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        hudScan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        soundWave: {
          '0%, 100%': { height: '6px' },
          '50%': { height: '22px' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
        'float': 'floatSubtle 3.2s ease-in-out infinite',
        'radar': 'radarSweep 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'hud-scan': 'hudScan 8s linear infinite',
        'sound-wave-1': 'soundWave 0.8s ease-in-out infinite',
        'sound-wave-2': 'soundWave 0.6s ease-in-out infinite 0.2s',
        'sound-wave-3': 'soundWave 0.9s ease-in-out infinite 0.4s',
        'sound-wave-4': 'soundWave 0.7s ease-in-out infinite 0.1s',
        'fade-in-scale': 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}

