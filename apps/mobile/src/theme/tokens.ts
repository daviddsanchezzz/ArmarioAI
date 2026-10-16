export const palette = {
  light: {
    background: '#F4F2EE',
    surface: '#FFFFFF',
    surfaceMuted: '#EAE7E1',
    text: '#1A1A1A',
    textMuted: '#6B6862',
    border: '#DDD9D2',
    primary: '#1A1A1A',
    onPrimary: '#FFFFFF',
    danger: '#B3261E',
    onDanger: '#FFFFFF',
    skeleton: '#E4E0D9',
  },
  dark: {
    background: '#121212',
    surface: '#1C1C1C',
    surfaceMuted: '#262626',
    text: '#F2F0EC',
    textMuted: '#A19E98',
    border: '#2F2F2F',
    primary: '#F2F0EC',
    onPrimary: '#121212',
    danger: '#F2B8B5',
    onDanger: '#601410',
    skeleton: '#2A2A2A',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const fontSize = { caption: 12, body: 15, subtitle: 17, title: 22, display: 30 } as const;
