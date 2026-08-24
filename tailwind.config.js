/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Heebo", "sans-serif"],
        body: ["Assistant", "sans-serif"],
      },
      colors: {
        cream: "#FBF7F2",
        base: "#F0EEE9",
        ink: "#2A2724",
        muted: "#9C948B",
        mutedDark: "#7A7168",
        mutedLight: "#B3AAA0",
        chip: "#EFE8DF",
        border: "#DED5CA",
        terracotta: "#E2603C",
        terracottaLight: "#F0C4B6",
        sage: "#5C7A63",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};
