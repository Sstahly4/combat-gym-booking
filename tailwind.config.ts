import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        /** Subtle OTA-style tap feedback on mobile bottom nav icons */
        "bottom-nav-icon-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.07)" },
          "100%": { transform: "scale(1)" },
        },
        /** Confirm-and-pay mobile review nudge — grow in on load */
        "checkout-review-nudge-enter": {
          "0%": { opacity: "0", transform: "scale(0.88)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        /** Bounce chevron downward to hint scrolling down the page */
        "checkout-review-nudge-arrow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bottom-nav-icon-pop":
          "bottom-nav-icon-pop 0.26s cubic-bezier(0.22, 1, 0.36, 1) both",
        "checkout-review-nudge-enter":
          "checkout-review-nudge-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "checkout-review-nudge-arrow":
          "checkout-review-nudge-arrow 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addVariant }: { addVariant: (name: string, definition: string) => void }) {
      // Hover backgrounds only on devices with a real pointer — prevents sticky
      // blue/gray tap highlights on iOS Safari after a touch ends.
      addVariant("can-hover", "@media (hover: hover) and (pointer: fine)")
    },
  ],
} satisfies Config

export default config
