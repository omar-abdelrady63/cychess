import { useTheme } from '../context/ThemeContext';

const Themes = () => {
    const { theme: currentTheme, changeTheme, themes, themeConfig } = useTheme();

    return (
        <div className="container">
            <h1 className="page-title">Choose Your Theme</h1>
            <p className="page-subtitle">Select a color scheme that suits your style</p>

            <div className="themes-grid">
                {themes.map((themeKey) => {
                    const themeInfo = themeConfig[themeKey];
                    const isActive = currentTheme === themeKey;

                    return (
                        <div
                            key={themeKey}
                            className={`theme-card ${isActive ? 'active' : ''}`}
                            onClick={() => changeTheme(themeKey)}
                        >
                            <h3>{themeInfo.name}</h3>
                            <div className="color-preview">
                                {themeInfo.colors.slice(0, 5).map((color, idx) => (
                                    <div
                                        key={idx}
                                        className="color-swatch"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <button className="btn-outline w-full">
                                {isActive ? <><i className="fa-solid fa-check" style={{ marginRight: '5px' }}></i> Active</> : 'Apply'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Themes;

