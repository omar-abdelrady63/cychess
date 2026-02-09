
export const THEMES = {
    ForestWhisper: {
        name: 'Forest Whisper',
        colors: ["#dad7cd", "#a3b18a", "#588157", "#3a5a40", "#344e41"]
    },
    BlueHorizon: {
        name: 'Blue Horizon',
        colors: ["#03045e", "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4", "#caf0f8"]
    },
    DeepAtlantic: {
        name: 'Deep Atlantic',
        colors: ["#134074", "#13315c", "#0b2545", "#8da9c4", "#eef4ed"]
    },
    MysticPurple: {
        name: 'Mystic Purple',
        colors: ["#10002b", "#240046", "#3c096c", "#5a189a", "#7b2cbf", "#9d4edd", "#c77dff", "#e0aaff"]
    },
    RosyChill: {
        name: 'Rosy Chill',
        colors: ["#880d1e", "#dd2d4a", "#f26a8d", "#f49cbb", "#cbeef3"]
    },
    GoldenNight: {
        name: 'Golden Night',
        colors: ["#000000", "#14213d", "#fca311", "#e5e5e5", "#ffffff"]
    },
    Sandalwood: {
        name: 'Sandalwood',
        colors: ["#ede0d4", "#e6ccb2", "#ddb892", "#b08968", "#7f5539", "#9c6644"]
    },
    AshToOnyx: {
        name: 'Ash to Onyx',
        colors: ["#f8f9fa", "#e9ecef", "#dee2e6", "#ced4da", "#adb5bd", "#6c757d", "#495057", "#343a40", "#212529"]
    },
    darkFantasy: {
        name: 'Dark Fantasy',
        colors: ["#0d0e14", "#252933", "#404556", "#60515c", "#777076", "#597d7c", "#386775", "#20504e", "#193d31", "#17292b"]
    },
    PassionFruit: {
        name: 'Passion Fruit',
        colors: ["#590d22", "#800f2f", "#a4133c", "#c9184a", "#ff4d6d", "#ff758f", "#ff8fa3", "#ffb3c1", "#ffccd5", "#fff0f3"]
    },
    ElectricLime: {
        name: 'Electric Lime',
        colors: ["#007f5f", "#2b9348", "#55a630", "#80b918", "#aacc00", "#bfd200", "#d4d700", "#dddf00", "#eeef20", "#ffff3f"]
    },
    cryingObsidian: {
        name: 'Crying Obsidian',
        colors: ["#020109", "#03052E", "#140152", "#22007B", "#0D00A5"]
    },
    shadowTimber: {
        name: 'Shadow Timber',
        colors: ["#0d060f", "#1e2824", "#5d3c18", "#766b65", "#230000"]
    },
    volcanicAsh: {
        name: 'Volcanic Ash',
        colors: ["#181818", "#282828", "#404048", "#505860", "#66707a", "#381820", "#501820", "#502028"]
    },
    desertOasis: {
        name: 'Desert Oasis',
        colors: ["#2176ae", "#57b8ff", "#b66d0d", "#fbb13c", "#fe6847"]
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
    return LEGACY_THEME_MAPPING[oldKey] || 'olive';
};
