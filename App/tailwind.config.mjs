/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace']
  		},
  		boxShadow: {
  			glass: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 30px -12px rgba(0,0,0,0.7)',
  			'glow-emerald': '0 0 0 1px rgba(52,211,153,0.18), 0 8px 40px -12px rgba(16,185,129,0.45)',
  			'glow-soft': '0 18px 60px -24px rgba(45,212,191,0.35)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'aurora-drift': {
  				'0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
  				'33%': { transform: 'translate3d(3%,-4%,0) scale(1.08)' },
  				'66%': { transform: 'translate3d(-3%,3%,0) scale(0.96)' }
  			},
  			'sheen': {
  				'0%': { transform: 'translateX(-120%) skewX(-12deg)' },
  				'100%': { transform: 'translateX(220%) skewX(-12deg)' }
  			},
  			'pulse-ring': {
  				'0%': { opacity: '0.9', transform: 'scale(0.85)' },
  				'70%,100%': { opacity: '0', transform: 'scale(2.2)' }
  			},
  			'rise': {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'aurora-slow': 'aurora-drift 26s ease-in-out infinite',
  			'aurora-slower': 'aurora-drift 38s ease-in-out infinite',
  			'sheen': 'sheen 1.1s ease-out',
  			'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
  			'rise': 'rise 0.5s cubic-bezier(0.16,1,0.3,1) both'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
