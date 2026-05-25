/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--clr-bg)",
        bg2: "var(--clr-bg2)",
        bg3: "var(--clr-bg3)",
        "bg-hover": "var(--clr-bg-hover)",
        card: "var(--clr-card)",
        "card-border": "var(--clr-card-border)",
        text: "var(--clr-text)",
        text2: "var(--clr-text2)",
        text3: "var(--clr-text3)",
        border: "var(--clr-border)",
        "border-light": "var(--clr-border-light)",
        
        accent: "var(--clr-accent)",
        "accent-hover": "var(--clr-accent-hover)",
        "accent-bg": "var(--clr-accent-bg)",
        "accent-text": "var(--clr-accent-text)",
        
        danger: "var(--clr-danger)",
        "danger-bg": "var(--clr-danger-bg)",
        success: "var(--clr-success)",
        "success-bg": "var(--clr-success-bg)",
        warn: "var(--clr-warn)",
        "warn-bg": "var(--clr-warn-bg)",
        info: "var(--clr-info)",
        "info-bg": "var(--clr-info-bg)",
        orange: "var(--clr-orange)",
        "orange-bg": "var(--clr-orange-bg)",

        "input-bg": "var(--clr-input-bg)",
        "input-border": "var(--clr-input-border)",
        
        sidebar: "var(--clr-sidebar)",
        "sidebar-border": "var(--clr-sidebar-border)",
        "sidebar-text": "var(--clr-sidebar-text)",
        "sidebar-text-active": "var(--clr-sidebar-text-active)",
        "sidebar-item-hover": "var(--clr-sidebar-item-hover)",
        "sidebar-item-active": "var(--clr-sidebar-item-active)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
}
