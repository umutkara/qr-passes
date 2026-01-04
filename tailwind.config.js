/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#ffffff",
          secondary: "#e5e5e5",
          subtle: "#9ca3af",
        },
  
        // --- АНИМАЦИИ ---
        keyframes: {
          fadeIn: {
            "0%": { opacity: 0, transform: "translateY(10px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
          slideUp: {
            "0%": { opacity: 0, transform: "translateY(20px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
          scaleIn: {
            "0%": { opacity: 0, transform: "scale(0.97)" },
            "100%": { opacity: 1, transform: "scale(1)" },
          },
        },
        animation: {
          fadeIn: "fadeIn .6s ease-out forwards",
          slideUp: "slideUp .7s ease-out forwards",
          scaleIn: "scaleIn .5s ease-out forwards",
        },
      },
    },
    plugins: [],
  };
  