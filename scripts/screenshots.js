// Regenerates docs/screenshots/*.png from demo/index.html.
//   cd <repo> && python3 -m http.server 8765 &        (serve the repo)
//   node scripts/screenshots.js [http://127.0.0.1:8765] [cdp-url]
// Needs Playwright (npm i playwright) and a Chromium: a running one via the CDP url, or it launches its own with software WebGL.
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765', cdp = process.argv[3];
const states = (process.argv[4] || 'clear,night,partly,cloudy,rain,pouring,storm,snow,fog,windy').split(',');
(async () => {
  require('fs').mkdirSync('docs/screenshots', { recursive: true });
  const b = cdp ? await chromium.connectOverCDP(cdp) : await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  for (const s of states) {   // fresh context per state: software WebGL leaks memory across navigations
    const ctx = await b.newContext({ viewport: { width: 560, height: 1000 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${base}/demo/index.html?bare=1&demo=${s}`, { waitUntil: 'load' }); await p.waitForTimeout(9000);
    const bb = await (await p.$('ha-animated-weather-card')).boundingBox(); await p.screenshot({ path: `docs/screenshots/${s}.png`, clip: bb }); console.log('shot', s); await ctx.close();
  }
  if (errs.length) console.log('errors:', [...new Set(errs)].join('\n'));
  await b.close();
})();
