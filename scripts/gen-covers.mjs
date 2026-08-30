import fs from 'node:fs';

const covers = {
  aurora: ['#3B1E8F', '#6A35FF', '#B78CFF', '#FF9BC4'],
  sunset: ['#4A1A3D', '#B03A6E', '#FF7A59', '#FFD08A'],
  ocean: ['#062A4A', '#0E5C8A', '#28A0C8', '#9FE7E1'],
  meadow: ['#123A2B', '#2E7D5B', '#79C08A', '#E4EFA8'],
  ember: ['#3A1206', '#8C3A17', '#D9702F', '#F5C77E'],
  midnight: ['#0B1030', '#22265E', '#4A4FA0', '#8FA8E8'],
};

for (const [name, c] of Object.entries(covers)) {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img">',
    '<defs>',
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0" stop-color="${c[0]}"/>`,
    `<stop offset="0.45" stop-color="${c[1]}"/>`,
    `<stop offset="1" stop-color="${c[2]}"/>`,
    '</linearGradient>',
    '<radialGradient id="a" cx="0.2" cy="0.15" r="0.6">',
    `<stop offset="0" stop-color="${c[3]}" stop-opacity="0.55"/>`,
    `<stop offset="1" stop-color="${c[3]}" stop-opacity="0"/>`,
    '</radialGradient>',
    '<radialGradient id="b" cx="0.85" cy="0.9" r="0.65">',
    `<stop offset="0" stop-color="${c[3]}" stop-opacity="0.35"/>`,
    `<stop offset="1" stop-color="${c[3]}" stop-opacity="0"/>`,
    '</radialGradient>',
    '</defs>',
    '<rect width="1200" height="675" fill="url(#g)"/>',
    '<rect width="1200" height="675" fill="url(#a)"/>',
    '<rect width="1200" height="675" fill="url(#b)"/>',
    '<g fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2">',
    '<circle cx="960" cy="150" r="120"/>',
    '<circle cx="960" cy="150" r="190"/>',
    '<circle cx="220" cy="560" r="140"/>',
    '</g>',
    '</svg>',
    '',
  ].join('\n');
  fs.writeFileSync(new URL(`../public/covers/${name}.svg`, import.meta.url), svg);
}
