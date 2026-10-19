/**
 * Accurate simplified landmass polygons for client-side tactical 3D globe canvas texture.
 * Completely self-contained: 0 external API calls, 0 network requests, 0 rate limits.
 */

// Normalized coordinates [x, y] where x is 0..2048 (equirectangular 360° longitude -180..+180)
// and y is 0..1024 (latitude +90..-90)
export function lonLatToCanvas(lon: number, lat: number, width = 2048, height = 1024): [number, number] {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

// Major continental landmass outlines [lon, lat][]
export const WORLD_CONTINENT_POLYGONS: [number, number][][] = [
  // North America
  [
    [-168, 65], [-160, 71], [-140, 70], [-130, 70], [-120, 76], [-100, 74],
    [-80, 74], [-75, 62], [-60, 60], [-55, 52], [-65, 44], [-70, 42],
    [-75, 35], [-80, 25], [-81, 25], [-85, 30], [-97, 26], [-97, 20],
    [-88, 16], [-84, 10], [-77, 8], [-80, 9], [-83, 10], [-87, 14],
    [-92, 16], [-105, 20], [-105, 23], [-110, 30], [-117, 32], [-124, 38],
    [-124, 48], [-130, 55], [-137, 59], [-150, 60], [-160, 56], [-168, 65]
  ],
  // Greenland
  [
    [-44, 60], [-35, 66], [-25, 76], [-20, 82], [-40, 83], [-55, 82],
    [-60, 76], [-50, 68], [-44, 60]
  ],
  // South America
  [
    [-77, 8], [-72, 11], [-60, 10], [-50, 0], [-35, -5], [-35, -8],
    [-38, -13], [-40, -22], [-48, -28], [-53, -33], [-58, -38], [-65, -45],
    [-66, -54], [-72, -53], [-75, -48], [-74, -40], [-72, -30], [-70, -18],
    [-80, -5], [-80, 2], [-77, 8]
  ],
  // Europe
  [
    [-9, 36], [-9, 43], [-1, 44], [-5, 48], [2, 51], [8, 54],
    [10, 58], [5, 62], [15, 68], [28, 71], [40, 68], [45, 60],
    [35, 52], [28, 45], [26, 40], [23, 38], [15, 40], [12, 44],
    [5, 43], [3, 42], [-3, 37], [-9, 36]
  ],
  // Great Britain & Ireland
  [
    [-5, 50], [1, 51], [0, 53], [-2, 58], [-5, 58], [-4, 55], [-5, 50]
  ],
  // Africa
  [
    [-6, 36], [10, 37], [25, 32], [32, 31], [33, 28], [37, 23],
    [43, 13], [51, 12], [42, 0], [40, -10], [35, -20], [32, -28],
    [28, -33], [18, -34], [15, -28], [12, -18], [10, -5], [9, 4],
    [3, 6], [-13, 8], [-17, 12], [-17, 21], [-13, 28], [-6, 36]
  ],
  // Madagascar
  [
    [49, -12], [50, -15], [47, -25], [44, -25], [44, -18], [49, -12]
  ],
  // Asia
  [
    [40, 68], [60, 73], [75, 73], [100, 77], [130, 73], [170, 68],
    [180, 65], [170, 60], [160, 56], [142, 52], [132, 43], [129, 35],
    [122, 30], [118, 22], [109, 18], [105, 10], [100, 3], [98, 10],
    [88, 22], [80, 16], [78, 8], [72, 20], [67, 25], [60, 25],
    [50, 30], [48, 40], [40, 42], [36, 36], [40, 68]
  ],
  // Arabian Peninsula
  [
    [35, 30], [40, 28], [50, 27], [56, 26], [59, 22], [54, 17],
    [45, 13], [43, 13], [37, 22], [35, 30]
  ],
  // Japan
  [
    [130, 32], [135, 34], [140, 36], [142, 44], [145, 44], [141, 38], [131, 31]
  ],
  // Indonesia & Southeast Asia Islands
  [
    [95, 5], [100, -2], [106, -6], [115, -8], [120, -8], [115, -3], [100, 1], [95, 5]
  ],
  [
    [110, 2], [117, 4], [118, -3], [110, -3], [110, 2]
  ],
  // Australia
  [
    [114, -22], [113, -26], [115, -34], [120, -34], [135, -35], [138, -35],
    [141, -38], [148, -38], [153, -28], [150, -22], [143, -13], [136, -12],
    [130, -13], [124, -16], [117, -20], [114, -22]
  ],
  // New Zealand
  [
    [174, -36], [178, -38], [175, -41], [172, -44], [168, -46], [168, -44], [174, -36]
  ],
  // Antarctica
  [
    [-180, -78], [-120, -74], [-60, -65], [0, -70], [60, -68], [120, -66], [180, -78]
  ]
];

/**
 * Procedurally generates a high-definition tactical world map texture.
 * Contains glowing continent outlines, subtle matrix stippling, and lat/lon graticules.
 */
export function createTacticalEarthCanvas(): HTMLCanvasElement {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Deep space ocean base
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, width, height);

  // 2. Latitude and Longitude Graticule grid
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';

  // Longitude meridians every 15 degrees
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Latitude parallels every 15 degrees
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Equator & Prime Meridian accent line
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)'; // Cyan accent
  ctx.lineWidth = 1.5;
  const equatorY = height / 2;
  const primeMeridianX = width / 2;

  ctx.beginPath();
  ctx.moveTo(0, equatorY);
  ctx.lineTo(width, equatorY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(primeMeridianX, 0);
  ctx.lineTo(primeMeridianX, height);
  ctx.stroke();

  // Tropic of Cancer (23.5° N) & Capricorn (23.5° S)
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
  ctx.beginPath();
  ctx.moveTo(0, ((90 - 23.5) / 180) * height);
  ctx.lineTo(width, ((90 - 23.5) / 180) * height);
  ctx.moveTo(0, ((90 + 23.5) / 180) * height);
  ctx.lineTo(width, ((90 + 23.5) / 180) * height);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // 3. Render Landmass Continents with tactical styling
  WORLD_CONTINENT_POLYGONS.forEach((polygon) => {
    if (polygon.length < 3) return;

    ctx.beginPath();
    const [startX, startY] = lonLatToCanvas(polygon[0][0], polygon[0][1], width, height);
    ctx.moveTo(startX, startY);

    for (let i = 1; i < polygon.length; i++) {
      const [px, py] = lonLatToCanvas(polygon[i][0], polygon[i][1], width, height);
      ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Dark tactical slate continent fill
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Continent border glow
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'; // light cyan/sky
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Subtle inner fill border
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
    ctx.lineWidth = 4.0;
    ctx.stroke();
  });

  // 4. Tactical coordinate reference labels on equator & prime meridian
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  for (let lon = -180; lon < 180; lon += 60) {
    const x = ((lon + 180) / 360) * width + 4;
    ctx.fillText(`${lon}°`, x, equatorY - 4);
  }

  return canvas;
}
