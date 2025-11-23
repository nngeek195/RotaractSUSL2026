import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        // Include all potential template locations
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                playfair: ['"Playfair Display"', 'serif'],
                poppins: ['Poppins', 'sans-serif'],
                prata: ['Prata', 'serif'],
            },
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                // Custom brand colors (adjust to match Figma if needed)
                'rotaract-pink': '#DB2374',
                'text-pink-600': '#DB2374',
            },
        },
    },
    plugins: [],
};
export default config;