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
        // 2. Gold Amber palette (Primary Brand Accent / CTAs / Highlights / Glow)
        amber: {
          50: '#FFFDF5',
          100: '#FEF9E7',
          200: '#FDF0C6',
          300: '#FCE395',
          400: '#F9D054',
          500: '#E5A919',
          600: '#C68A0C',
          700: '#9E6907',
          800: '#7A5007',
          900: '#5C3B07',
          950: '#382202',
        },
        gold: {
          50: '#FFFDF5',
          100: '#FEF9E7',
          200: '#FDF0C6',
          300: '#FCE395',
          400: '#F9D054',
          500: '#E5A919',
          600: '#C68A0C',
          700: '#9E6907',
          800: '#7A5007',
          900: '#5C3B07',
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
        // Harmonized brand alias (Exact Brand Color Palette)
        brand: {
          'primary-bg': '#F7F1E7',
          'secondary-bg': '#FFF9F0',
          'primary-text': '#14243A',
          'secondary-text': '#526174',
          'primary-accent': '#D99A32',
          'hover-accent': '#B97B20',
          'borders': '#E6D9C6',
          'cards': '#FFFCF7',
          50: '#FAF8F5',
          100: '#FEF9E7',
          200: '#FDF0C6',
          300: '#FCE395',
          400: '#F9D054',
          500: '#E5A919',
          600: '#D99A32',
          700: '#B97B20',
          800: '#14243A',
          900: '#0B1524',
          950: '#070D18',
        },
        // Harmonize slate to bridge Warm Beige (light) & Deep Navy (dark)
        slate: {
          50: '#FAF8F5',   // Canvas warm beige
          100: '#F4EFEA',  // Container warm beige
          200: '#E8DFD5',  // Subtle warm border
          300: '#D8CCC0',  // Accent border
          400: '#9E978E',  // Muted stone
          500: '#6B7280',  // Neutral secondary text
          600: '#40526B',  // Slate navy medium
          700: '#233752',  // Deep navy subtle
          800: '#132238',  // Deep navy surface
          900: '#0B1524',  // Deep navy primary
          950: '#070D18',  // Deep navy midnight
        },
        // Harmonize sky to Gold Amber for complete system-wide button and focus ring theme
        sky: {
          50: '#FFFDF5',
          100: '#FEF9E7',
          200: '#FDF0C6',
          300: '#FCE395',
          400: '#F9D054',
          500: '#E5A919',
          600: '#C68A0C',
          700: '#9E6907',
          800: '#7A5007',
          900: '#5C3B07',
          950: '#382202',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(198, 138, 12, 0.25)',
        'gold-lg': '0 10px 25px -3px rgba(198, 138, 12, 0.3)',
        'gold-glow': '0 0 20px 2px rgba(198, 138, 12, 0.35)',
        'gold-glow-lg': '0 0 35px 5px rgba(198, 138, 12, 0.5)',
        'navy': '0 4px 20px 0 rgba(11, 21, 36, 0.12)',
        'navy-lg': '0 12px 30px -4px rgba(11, 21, 36, 0.25)',
        'cyan-glow': '0 0 20px 2px rgba(6, 182, 212, 0.4)',
        'emerald-glow': '0 0 20px 2px rgba(16, 185, 129, 0.4)',
        'hologram': '0 0 25px rgba(198, 138, 12, 0.15), inset 0 0 15px rgba(198, 138, 12, 0.1)',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(198, 138, 12, 0.6))' },
          '50%': { opacity: '0.65', filter: 'drop-shadow(0 0 2px rgba(198, 138, 12, 0.2))' },
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

