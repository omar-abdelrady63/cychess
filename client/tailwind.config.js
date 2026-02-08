export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--bg-primary)',
                secondary: 'var(--bg-secondary)',
                tertiary: 'var(--bg-tertiary)',
                accent: 'var(--accent)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                glass: {
                    DEFAULT: 'var(--glass-bg)',
                    hover: 'var(--glass-bg-hover)',
                    active: 'var(--glass-bg-active)',
                }
            },
            spacing: {
                xs: 'var(--spacing-xs)',
                sm: 'var(--spacing-sm)',
                md: 'var(--spacing-md)',
                lg: 'var(--spacing-lg)',
                xl: 'var(--spacing-xl)',
                '2xl': 'var(--spacing-2xl)',
            },
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                full: 'var(--radius-full)',
            },
            boxShadow: {
                glass: 'var(--glass-shadow)',
                glow: 'var(--glass-glow)',
            },
            transitionProperty: {
                'colors-shadow': 'color, background-color, border-color, text-decoration-color, fill, stroke, box-shadow, backdrop-filter',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
