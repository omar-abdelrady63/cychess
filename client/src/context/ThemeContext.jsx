import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

const THEMES = [
    'deep-navy',
    'black-gold',
    'grey-beige',
    'purple-silver',
    'crimson-shadow',
    'emerald-city',
    'royal-blue',
    'sunset-horizon',
    'neon-nights',
    'ocean-breeze',
    'amber-glow',
    'lavender-dreams',
    'midnight-forest',
    'cherry-blossom',
    'arctic-frost'
];

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'deep-navy';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const changeTheme = (newTheme) => {
        if (THEMES.includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    const value = {
        theme,
        changeTheme,
        themes: THEMES
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
