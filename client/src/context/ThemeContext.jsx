import { createContext, useState, useContext, useEffect } from 'react';
import { THEMES, getThemeKeys, migrateLegacyTheme } from '../config/themes';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');

        if (!savedTheme) {
            return 'olive';
        }

        const themeKeys = getThemeKeys();
        if (!themeKeys.includes(savedTheme)) {
            const migratedTheme = migrateLegacyTheme(savedTheme);
            localStorage.setItem('theme', migratedTheme);
            return migratedTheme;
        }

        return savedTheme;
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const changeTheme = (newTheme) => {
        const themeKeys = getThemeKeys();
        if (themeKeys.includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    const value = {
        theme,
        changeTheme,
        themes: getThemeKeys(),
        themeConfig: THEMES
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

