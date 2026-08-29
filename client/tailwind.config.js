/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design.md Placeholder Tokens (Pending ui-ux-pro-max generator)
        primary: {
          DEFAULT: '#2F5233', // Deep natural green
          hover: '#244027',
          light: '#EAF2EB',
        },
        secondary: {
          DEFAULT: '#D9A566', // Warm earthy gold
          hover: '#C28F50',
          light: '#FBF5EE',
        },
        background: {
          DEFAULT: '#FAF7F2', // Warm off-white
          card: '#FFFFFF',
          muted: '#F0ECE4',
        },
        text: {
          primary: '#1F2421', // Near-black charcoal
          secondary: '#555E57',
          muted: '#838E86',
        },
        success: {
          DEFAULT: '#3A7D44',
          light: '#E8F5E9',
        },
        error: {
          DEFAULT: '#B3413A',
          light: '#FDF2F2',
        },
        ai: {
          DEFAULT: '#4A7C7C', // Muted teal for AI assistant
          light: '#EBF3F3',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(31, 36, 33, 0.06)',
        card: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
