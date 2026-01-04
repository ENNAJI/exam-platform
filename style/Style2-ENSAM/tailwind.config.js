/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { 
          DEFAULT: '#2C3E50', 
          light: '#34495E', 
          dark: '#1A252F' 
        },
        secondary: { 
          DEFAULT: '#3498DB', 
          light: '#5DADE2', 
          dark: '#2980B9' 
        },
        accent: { 
          DEFAULT: '#E74C3C', 
          light: '#EC7063', 
          dark: '#C0392B' 
        },
        success: { 
          DEFAULT: '#2ECC71', 
          light: '#58D68D', 
          dark: '#27AE60' 
        },
        warning: { 
          DEFAULT: '#F39C12', 
          light: '#F5B041', 
          dark: '#D68910' 
        },
        ensam: {
          blue: '#0056B3',
          gray: '#333333'
        },
        uh2c: {
          blue: '#003366',
          gold: '#FFD700'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        heading: ['Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
