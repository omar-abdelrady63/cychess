import { useTheme } from '../context/ThemeContext';

const THEME_INFO = {
    'deep-navy': { name: 'Deep Navy', colors: ['#0F172A', '#334155', '#38BDF8'] },
    'black-gold': { name: 'Black & Gold', colors: ['#0a0a0a', '#B8860B', '#FFD700'] },
    'grey-beige': { name: 'Grey & Beige', colors: ['#2f3640', '#7f8fa6', '#f5f6fa'] },
    'purple-silver': { name: 'Purple & Silver', colors: ['#190028', '#3c096c', '#e0e0e0'] },
    'crimson-shadow': { name: 'Crimson Shadow', colors: ['#000000', '#8b0000', '#ff0000'] },
    'emerald-city': { name: 'Emerald City', colors: ['#052e16', '#047857', '#d1fae5'] },
    'royal-blue': { name: 'Royal Blue', colors: ['#0a1128', '#1282a2', '#fefcfb'] },
    'sunset-horizon': { name: 'Sunset Horizon', colors: ['#2d1b2e', '#fca311', '#ffffb3'] },
    'neon-nights': { name: 'Neon Nights', colors: ['#090909', '#ff2a6d', '#05d9e8'] },
    'ocean-breeze': { name: 'Ocean Breeze', colors: ['#006D77', '#83C5BE', '#EDF6F9'] },
    'amber-glow': { name: 'Amber Glow', colors: ['#FF6B35', '#F7931E', '#FDC830'] },
    'lavender-dreams': { name: 'Lavender Dreams', colors: ['#E0BBE4', '#957DAD', '#D291BC'] },
    'midnight-forest': { name: 'Midnight Forest', colors: ['#0d1b0d', '#2d4a2d', '#d4af37'] },
    'cherry-blossom': { name: 'Cherry Blossom', colors: ['#1a0a1f', '#4a2555', '#ff69b4'] },
    'arctic-frost': { name: 'Arctic Frost', colors: ['#0a1420', '#1f3a52', '#87ceeb'] }
};

const Themes = () => {
    const { theme: currentTheme, changeTheme, themes } = useTheme();

    return (
        <div className="container">
            <h1 className="page-title">Choose Your Theme</h1>
            <p className="page-subtitle">Select a color scheme that suits your style</p>

            <div className="themes-grid">
                {themes.map((themeKey) => {
                    const themeInfo = THEME_INFO[themeKey];
                    const isActive = currentTheme === themeKey;

                    return (
                        <div
                            key={themeKey}
                            className={`theme-card ${isActive ? 'active' : ''}`}
                            onClick={() => changeTheme(themeKey)}
                        >
                            <h3>{themeInfo.name}</h3>
                            <div className="color-preview">
                                {themeInfo.colors.map((color, idx) => (
                                    <div
                                        key={idx}
                                        className="color-swatch"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <button className="btn-outline w-full">
                                {isActive ? '✓ Active' : 'Apply'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Themes;
