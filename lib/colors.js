/**
 * Comprehensive color dictionary and CSS color resolver.
 * Maps arbitrary color names (e.g. "dark green", "navy blue", "bottle green", "wine red")
 * or hex codes to valid, beautiful CSS color hex strings.
 */

export const COLOR_PALETTE = {
  // Greens
  'dark green': '#006400',
  'darkgreen': '#006400',
  'green': '#16a34a',
  'light green': '#86efac',
  'lightgreen': '#86efac',
  'bottle green': '#094d2a',
  'bottlegreen': '#094d2a',
  'olive': '#808000',
  'olive green': '#556b2f',
  'olivegreen': '#556b2f',
  'military green': '#4b5320',
  'army green': '#4b5320',
  'mint': '#6ee7b7',
  'mint green': '#a7f3d0',
  'mintgreen': '#a7f3d0',
  'emerald': '#059669',
  'emerald green': '#059669',
  'forest green': '#228b22',
  'forestgreen': '#228b22',
  'lime': '#84cc16',
  'lime green': '#32cd32',
  'limegreen': '#32cd32',
  'sage': '#9ca986',
  'sage green': '#9ca986',
  'teal': '#0d9488',
  'sea green': '#2e8b57',
  'seagreen': '#2e8b57',
  'pine green': '#01796f',
  'neon green': '#39ff14',

  // Blues
  'blue': '#2563eb',
  'dark blue': '#00008b',
  'darkblue': '#00008b',
  'navy': '#000080',
  'navy blue': '#000080',
  'navyblue': '#000080',
  'royal blue': '#4169e1',
  'royalblue': '#4169e1',
  'sky blue': '#0ea5e9',
  'skyblue': '#0ea5e9',
  'light blue': '#93c5fd',
  'lightblue': '#93c5fd',
  'baby blue': '#89cff0',
  'babyblue': '#89cff0',
  'indigo': '#4f46e5',
  'cyan': '#06b6d4',
  'cobalt': '#0047ab',
  'cobalt blue': '#0047ab',
  'midnight blue': '#191970',
  'midnightblue': '#191970',
  'ice blue': '#d0f0fd',
  'turqoise': '#40e0d0',
  'turquoise': '#40e0d0',
  'aqua': '#00ffff',
  'petrol blue': '#1b4d68',

  // Reds & Pinks
  'red': '#dc2626',
  'dark red': '#8b0000',
  'darkred': '#8b0000',
  'light red': '#f87171',
  'maroon': '#800000',
  'crimson': '#dc143c',
  'wine': '#722f37',
  'wine red': '#722f37',
  'winered': '#722f37',
  'burgundy': '#800020',
  'ruby': '#e0115f',
  'rose': '#f43f5e',
  'rose pink': '#ff66cc',
  'pink': '#ec4899',
  'light pink': '#fbcfe8',
  'hot pink': '#ff69b4',
  'hotpink': '#ff69b4',
  'baby pink': '#f4c2c2',
  'babypink': '#f4c2c2',
  'magenta': '#d946ef',
  'fuchsia': '#c026d3',
  'cherry': '#de3163',
  'cherry red': '#de3163',
  'salmon': '#fa8072',
  'coral': '#f87171',
  'brick red': '#cb4154',

  // Yellows & Oranges
  'yellow': '#eab308',
  'light yellow': '#fef08a',
  'lemon': '#fef08a',
  'lemon yellow': '#fff44f',
  'mustard': '#ca8a04',
  'mustard yellow': '#ca8a04',
  'gold': '#ffd700',
  'golden': '#ffd700',
  'golden yellow': '#ffdf00',
  'orange': '#ea580c',
  'light orange': '#fed7aa',
  'dark orange': '#ff8c00',
  'darkorange': '#ff8c00',
  'rust': '#b7410e',
  'rust orange': '#b7410e',
  'amber': '#d97706',
  'peach': '#ffcba4',
  'terracotta': '#e2725b',
  'copper': '#b87333',
  'bronze': '#cd7f32',
  'tangerine': '#f28500',

  // Purples
  'purple': '#9333ea',
  'dark purple': '#301934',
  'violet': '#7c3aed',
  'lavender': '#c084fc',
  'lilac': '#c8a2c8',
  'plum': '#dda0dd',
  'mauve': '#e0b0ff',
  'eggplant': '#614051',

  // Neutrals, Blacks, Whites & Greys
  'black': '#0f172a',
  'jet black': '#0a0a0a',
  'matte black': '#18181b',
  'white': '#ffffff',
  'off white': '#fafaf9',
  'offwhite': '#fafaf9',
  'cream': '#fffdd0',
  'ivory': '#fffff0',
  'beige': '#f5f5dc',
  'khaki': '#c3b091',
  'tan': '#d2b48c',
  'brown': '#78350f',
  'dark brown': '#654321',
  'light brown': '#b5651d',
  'coffee': '#6f4e37',
  'chocolate': '#7b3f00',
  'camel': '#c19a6b',
  'sand': '#c2b280',
  'grey': '#64748b',
  'gray': '#64748b',
  'light grey': '#cbd5e1',
  'light gray': '#cbd5e1',
  'dark grey': '#334155',
  'dark gray': '#334155',
  'charcoal': '#374151',
  'charcoal grey': '#374151',
  'charcoal gray': '#374151',
  'slate': '#475569',
  'silver': '#c0c0c0',
  'ash': '#b2beb5',
  'smoke': '#738276',
  'nude': '#e3bc9a',
  'multicolor': 'linear-gradient(135deg, #f87171, #60a5fa, #34d399, #facc15)',
  'multi': 'linear-gradient(135deg, #f87171, #60a5fa, #34d399, #facc15)'
};

/**
 * Resolves a color name or colorCode string to a valid CSS background color string (Hex, RGB, or Gradient).
 * @param {string} colorName - Name of the color (e.g. "dark green", "navy blue", "white")
 * @param {string} [colorCode] - Optional explicit hex or color code (e.g. "#006400")
 * @returns {string} Valid CSS color value
 */
export function getColorHex(colorName, colorCode = null) {
  // If a valid hex code was explicitly passed, prioritize it
  if (colorCode && typeof colorCode === 'string') {
    const trimmedCode = colorCode.trim();
    if (trimmedCode.startsWith('#') || trimmedCode.startsWith('rgb') || trimmedCode.startsWith('hsl') || trimmedCode.startsWith('linear-gradient')) {
      return trimmedCode;
    }
  }

  if (!colorName || typeof colorName !== 'string') {
    return '#64748B'; // Default slate fallback
  }

  const trimmed = colorName.trim().toLowerCase();

  // If colorName is itself a hex code
  if (trimmed.startsWith('#')) {
    return trimmed;
  }

  // Normalize spaces, hyphens, underscores (e.g. "  Dark - Green  " -> "dark green")
  const normalized = trimmed.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

  if (COLOR_PALETTE[normalized]) {
    return COLOR_PALETTE[normalized];
  }

  // Try without any spaces (e.g. "darkgreen")
  const noSpaces = normalized.replace(/\s+/g, '');
  if (COLOR_PALETTE[noSpaces]) {
    return COLOR_PALETTE[noSpaces];
  }

  // Handle dual-color combinations like "black/white", "navy/gold", "blue/red"
  if (trimmed.includes('/') || trimmed.includes('&')) {
    const delimiter = trimmed.includes('/') ? '/' : '&';
    const parts = trimmed.split(delimiter).map(p => getColorHex(p.trim())).filter(Boolean);
    if (parts.length >= 2) {
      return `linear-gradient(135deg, ${parts[0]} 50%, ${parts[1]} 50%)`;
    }
  }

  // If it's a valid single-word CSS standard color (e.g. 'maroon', 'cyan', 'turquoise')
  return noSpaces || '#64748B';
}
