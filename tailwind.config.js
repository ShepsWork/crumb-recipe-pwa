/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
        // Legacy kitchen theme (kept for backward compatibility)
        oatmeal: '#F2EFEA',
        blueberry: '#7C8FB2',
        dough: '#E9D8A6',
        sage: '#A3B18A',

        // Recipe Vault brand palette (deterministic, do NOT use Tailwind orange/red scales)
        rvOrange: '#FD5E53',      // Sunset Orange (Primary Actions) - gradient start
        rvOrangeMid: '#F45A4F',   // Optional gradient mid
        rvOrangeEnd: '#C7443C',   // Gradient end
        rvBlue: '#2C3E50',        // Slate Blue (Drawer, App Chrome)
        rvGray: '#4A4A4A',        // Structural Dark Gray (Text)
        rvYellow: '#F7D774',      // Soft Yellow (Highlights, active indicator)
        rvPageBg: '#F6F3EE',      // Warm neutral page background
        rvCardBg: '#FFFFFF',      // Card surfaces
        rvInputBg: '#F8F8F8',     // Input field background
      },
      boxShadow: {
        'rv-card': '0 8px 20px rgba(0,0,0,0.18)',
        'rv-cta': '0 10px 24px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}