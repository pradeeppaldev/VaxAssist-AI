/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        grotesk: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        itim: ['"Itim"', 'cursive', 'sans-serif'],
        sora: ['"Sora"', 'system-ui', 'sans-serif'],
      },
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
        // VaxAssist Core Brand Tokens
        vax: {
          cyan: "#15C2D9",
          dark: "#1F2C49",
          bg: "#FDFEFE",
          light: "#EDF3F7",
        },
        // Healthcare Semantic Status Colors
        status: {
          completed: "hsl(var(--status-completed))",
          "completed-fg": "hsl(var(--status-completed-foreground))",
          "completed-bg": "hsl(var(--status-completed-bg))",
          upcoming: "hsl(var(--status-upcoming))",
          "upcoming-fg": "hsl(var(--status-upcoming-foreground))",
          "upcoming-bg": "hsl(var(--status-upcoming-bg))",
          due: "hsl(var(--status-due))",
          "due-fg": "hsl(var(--status-due-foreground))",
          "due-bg": "hsl(var(--status-due-bg))",
          overdue: "hsl(var(--status-overdue))",
          "overdue-fg": "hsl(var(--status-overdue-foreground))",
          "overdue-bg": "hsl(var(--status-overdue-bg))",
          missed: "hsl(var(--status-missed))",
          "missed-fg": "hsl(var(--status-missed-foreground))",
          "missed-bg": "hsl(var(--status-missed-bg))",
          catchup: "hsl(var(--status-catchup))",
          "catchup-fg": "hsl(var(--status-catchup-foreground))",
          "catchup-bg": "hsl(var(--status-catchup-bg))",
          review: "hsl(var(--status-review))",
          "review-fg": "hsl(var(--status-review-foreground))",
          "review-bg": "hsl(var(--status-review-bg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
