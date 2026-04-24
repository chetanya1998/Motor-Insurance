/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12303A",
        slate: "#60707A",
        cloud: "#F3F8FA",
        mist: "#E7F1F5",
        brand: {
          50: "#EEF9FC",
          100: "#D4F2FA",
          200: "#A4E1F2",
          300: "#72CCE7",
          400: "#44B2D0",
          500: "#2588A4",
          600: "#1E6D84",
          700: "#165465",
          800: "#0F3D4D",
        },
        mint: {
          50: "#EFFBF7",
          100: "#D3F5EA",
          200: "#A7EACF",
          300: "#74D9B1",
          400: "#3FBE92",
          500: "#2D9D75",
          600: "#237C5C",
        },
        amber: {
          50: "#FFF8E8",
          100: "#FCEAB8",
          400: "#F2B84B",
          600: "#B57510",
        },
        rose: {
          50: "#FFF1F3",
          100: "#FFD7DD",
          500: "#D24C65",
          700: "#992844",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(18, 48, 58, 0.08)",
        glow: "0 12px 24px rgba(37, 136, 164, 0.16)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.015)", opacity: ".88" },
        },
      },
      animation: {
        rise: "rise .45s ease-out both",
        "pulse-soft": "pulseSoft 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
