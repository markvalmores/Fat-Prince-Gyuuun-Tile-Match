export interface LevelTheme {
  name: string;
  skyTop: string;
  skyBottom: string;
  ground: string;
  path: string;
  decorType: 'village' | 'farm' | 'city' | 'dungeon' | 'lava' | 'snow' | 'space' | 'dimension';
}

const baseThemes: LevelTheme[] = [
  { name: 'Normal', skyTop: '#87ceeb', skyBottom: '#4ade80', ground: '#7a9d54', path: '#d0a775', decorType: 'village' },
  { name: 'Farm', skyTop: '#fde047', skyBottom: '#87ceeb', ground: '#84cc16', path: '#eab308', decorType: 'farm' },
  { name: 'City', skyTop: '#2e1065', skyBottom: '#0f172a', ground: '#334155', path: '#475569', decorType: 'city' },
  { name: 'Dungeon', skyTop: '#1e1e1e', skyBottom: '#000000', ground: '#3f3f46', path: '#52525b', decorType: 'dungeon' },
  { name: 'Lava', skyTop: '#7f1d1d', skyBottom: '#000000', ground: '#451a03', path: '#b91c1c', decorType: 'lava' },
  { name: 'Snow Ice', skyTop: '#e0f2fe', skyBottom: '#bae6fd', ground: '#f1f5f9', path: '#cbd5e1', decorType: 'snow' },
  { name: 'Antarctica', skyTop: '#ccfbf1', skyBottom: '#7dd3fc', ground: '#e2e8f0', path: '#94a3b8', decorType: 'snow' },
  { name: 'North Pole', skyTop: '#0f172a', skyBottom: '#1e1b4b', ground: '#f8fafc', path: '#64748b', decorType: 'snow' },
  { name: 'Space', skyTop: '#000000', skyBottom: '#0a0a0a', ground: '#171717', path: '#262626', decorType: 'space' },
  { name: 'Galaxy', skyTop: '#2e1065', skyBottom: '#4c1d95', ground: '#1e1e1e', path: '#a855f7', decorType: 'space' },
  { name: 'Alternate Dimension', skyTop: '#022c22', skyBottom: '#14532d', ground: '#064e3b', path: '#10b981', decorType: 'dimension' },
];

export const getThemeForLevel = (level: number): LevelTheme => {
  const phase = (level - 1); // Change on every level!
  const baseTheme = baseThemes[phase % baseThemes.length];
  const cycle = Math.floor(phase / baseThemes.length);
  
  return {
    ...baseTheme,
    name: cycle > 0 ? `${baseTheme.name} ${cycle + 1}` : baseTheme.name
  };
};
