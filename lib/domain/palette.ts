// Swimmer colors. The actual light/dark values live in app/globals.css under [data-color="…"].
export const COLORS = ['orange', 'green', 'blue', 'purple', 'pink', 'teal'] as const;
export type ColorKey = (typeof COLORS)[number];

// Raw light-theme values, used where CSS variables can't reach (confetti).
export const CONFETTI = ['#E39400', '#0E9A63', '#2C62D4', '#E5484D', '#1679AB', '#8E5BD8'];
