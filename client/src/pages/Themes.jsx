import { useTheme } from '../context/ThemeContext';

const Themes = () => {
    const { theme: currentTheme, changeTheme, themes, themeConfig } = useTheme();

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Themes</h1>
                <p className="text-text-secondary opacity-80 mt-1">Choose a color palette for the app</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {themes.map((themeKey) => {
                    const themeInfo = themeConfig[themeKey];
                    const isActive = currentTheme === themeKey;
                    const colors = themeInfo.colors || [];

                    return (
                        <button
                            key={themeKey}
                            type="button"
                            onClick={() => changeTheme(themeKey)}
                            className={`
                                rounded-2xl border-2 p-5 sm:p-6 text-left transition-all
                                hover:border-white/30 hover:shadow-xl
                                ${isActive
                                    ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                                    : 'border-white/10 bg-secondary/80 backdrop-blur-xl'
                                }
                            `}
                        >
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h3 className="font-semibold text-text-primary text-lg">{themeInfo.name}</h3>
                                {isActive && (
                                    <span className="flex items-center gap-1.5 text-accent text-sm font-medium">
                                        <i className="fa-solid fa-check" /> Active
                                    </span>
                                )}
                            </div>
                            {}
                            <div className="flex flex-wrap gap-2">
                                {colors.slice(0, 8).map((color, idx) => (
                                    <div
                                        key={idx}
                                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-white/20 shrink-0 shadow-inner"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            {!isActive && (
                                <span className="mt-4 inline-block text-sm text-text-secondary opacity-80">Click to apply</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Themes;
