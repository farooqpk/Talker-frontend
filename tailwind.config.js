/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7541f1",
        secondary: "#9896a0"
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "dark",
      {
        mytheme: {
          primary: "#7541f1",
          "primary-focus": "#5d33dc",
          "primary-content": "#ffffff",

          secondary: "#9896a0",
          "secondary-focus": "#7e7c88",
          "secondary-content": "#000000",
        },
      },
    ],
  },
};
