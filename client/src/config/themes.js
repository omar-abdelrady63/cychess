
export const THEMES = {
    neon: {
        name: 'Light Green',
        colors: ["#020617", "#1e293b", "#aff33e", "#f8fafc", "#94a3b8"]
    },
    blue: {
        name: 'VTRON',
        colors: ["#000000", "#0f0f0f", "#2b65ff", "#ffffff", "#d9d9d9"]
    },
    discord: {
        name: 'Discord Theme',
        colors: ["#323339", "#393a41", "#5865f2", "#ffffff", "#a4a5ab"]
    },
    amber: {
        name: 'stella',
        colors: ["#120e08", "#1d160c", "#ffc16b", "#fff4e5", "#b8a994"]
    },
    teal: {
        name: 'Cigarette Butt',
        colors: ["#0e1312", "#151b1a", "#6ea8a3", "#e9ecec", "#93a5a4"]
    },
    cyberpunk: {
        name: 'Cyberpunk',
        colors: ["#120d1e", "#0c0128", "#00ff90", "#ff00af", "#e5e5e5"]
    }
};


export const LEGACY_THEME_MAPPING = {
    'deep-navy': 'DeepAtlantic',
    'black-gold': 'GoldenNight',
    'grey-beige': 'AshToOnyx',
    'purple-silver': 'MysticPurple',
    'crimson-shadow': 'volcanicAsh',
    'emerald-city': 'ForestWhisper',
    'royal-blue': 'DeepAtlantic',
    'sunset-horizon': 'desertOasis',
    'neon-nights': 'cryingObsidian',
    'ocean-breeze': 'BlueHorizon',
    'amber-glow': 'Sandalwood',
    'lavender-dreams': 'MysticPurple',
    'midnight-forest': 'shadowTimber',
    'cherry-blossom': 'RosyChill',
    'arctic-frost': 'BlueHorizon',
    'olive': 'ForestWhisper',
    'fiery': 'PassionFruit',
    'lavender': 'MysticPurple',
    'golden': 'GoldenNight',
    'neutral': 'AshToOnyx',
    'autumn': 'Sandalwood',
    'sunset': 'darkFantasy',
    'midnight': 'DeepAtlantic',
    'sea': 'BlueHorizon',
    'steel': 'AshToOnyx',
    'berry': 'PassionFruit',
    'rustic': 'Sandalwood',
    'fieryRed': 'PassionFruit',
    'oceanBlue': 'BlueHorizon',
    'beach': 'BlueHorizon'
};


export const getThemeKeys = () => Object.keys(THEMES);

export const getTheme = (key) => THEMES[key];

export const migrateLegacyTheme = (oldKey) => {
    return 'neon';
};
