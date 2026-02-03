
export const THEMES = {
    olive: {
        name: 'Olive Garden',
        colors: ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25']
    },
    fiery: {
        name: 'Fiery Depths',
        colors: ['#780000', '#c1121f', '#fdf0d5', '#003049', '#669bbc']
    },
    lavender: {
        name: 'Lavender Dreams',
        colors: ['#22223b', '#4a4e69', '#9a8c98', '#c9ada7', '#f2e9e4']
    },
    golden: {
        name: 'Golden Hour',
        colors: ['#000814', '#001d3d', '#003566', '#ffc300', '#ffd60a']
    },
    neutral: {
        name: 'Neutral Elegance',
        colors: ['#0a0908', '#22333b', '#eae0d5', '#c6ac8f', '#5e503f']
    },
    autumn: {
        name: 'Autumn Harvest',
        colors: ['#6f1d1b', '#bb9457', '#432818', '#99582a', '#ffe6a7']
    },
    sunset: {
        name: 'Sunset Boulevard',
        colors: ['#001427', '#708d81', '#f4d58d', '#bf0603', '#8d0801']
    },
    midnight: {
        name: 'Midnight Blue',
        colors: ['#00296b', '#003f88', '#00509d', '#fdc500', '#ffd500']
    },
    sea: {
        name: 'Deep Sea',
        colors: ['#0d1321', '#1d2d44', '#3e5c76', '#748cab', '#f0ebd8']
    },
    steel: {
        name: 'Steel Gray',
        colors: ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529']
    },
    berry: {
        name: 'Berry Bliss',
        colors: ['#f9dbbd', '#ffa5ab', '#da627d', '#a53860', '#450920']
    },
    rustic: {
        name: 'Rustic Charm',
        colors: ['#585123', '#eec170', '#f2a65a', '#f58549', '#772f1a']
    },
    fieryRed: {
        name: 'Fiery Red',
        colors: ['#03071e', '#370617', '#6a040f', '#9d0208', '#d00000', '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08']
    },
    oceanBlue: {
        name: 'Ocean Blue',
        colors: ['#006466', '#065a60', '#0b525b', '#144552', '#1b3a4b', '#212f45', '#272640', '#312244', '#3e1f47', '#4d194d']
    },
    beach: {
        name: 'Beach Vibes',
        colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']
    }
};

export const LEGACY_THEME_MAPPING = {
    'deep-navy': 'midnight',
    'black-gold': 'golden',
    'grey-beige': 'neutral',
    'purple-silver': 'lavender',
    'crimson-shadow': 'fiery',
    'emerald-city': 'sea',
    'royal-blue': 'midnight',
    'sunset-horizon': 'sunset',
    'neon-nights': 'fieryRed',
    'ocean-breeze': 'oceanBlue',
    'amber-glow': 'autumn',
    'lavender-dreams': 'lavender',
    'midnight-forest': 'olive',
    'cherry-blossom': 'berry',
    'arctic-frost': 'sea'
};

export const getThemeKeys = () => Object.keys(THEMES);

export const getTheme = (key) => THEMES[key];

export const migrateLegacyTheme = (oldKey) => {
    return LEGACY_THEME_MAPPING[oldKey] || 'olive';
};
