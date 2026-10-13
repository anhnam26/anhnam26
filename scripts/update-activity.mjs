import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const USERNAME = 'anhnam26';
const DAY = 86_400_000;
const ASSETS = new URL('../assets/', import.meta.url);

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[char]);

const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

// GitHub's public calendar includes counts in tooltips and levels in table cells.
// Reject changed or incomplete markup instead of publishing invented activity.
export function parseContributionCalendar(html) {
  const heading = html.match(/<h2\b[^>]*id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/)?.[1];
  const totalText = heading?.match(/([\d,]+)\s+contributions?/i)?.[1];
  if (!totalText) throw new Error('GitHub contribution total is missing.');
  const total = Number(totalText.replaceAll(',', ''));
  const counts = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
    const id = attribute(match[1], 'for');
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const count = text.match(/^(No|[\d,]+) contributions? on /i)?.[1];
    if (id && count) counts.set(id, count === 'No' ? 0 : Number(count.replaceAll(',', '')));
  }
  const days = [];
  for (const match of html.matchAll(/<td\b[^>]*>/g)) {
    const date = attribute(match[0], 'data-date');
    if (!date) continue;
    const levelText = attribute(match[0], 'data-level');
    const count = counts.get(attribute(match[0], 'id'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)
      || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      || !/^[0-4]$/.test(levelText ?? '') || !Number.isSafeInteger(count) || count < 0) {
      throw new Error(`Invalid contribution cell: ${date}`);
    }
    days.push({ date, count, level: Number(levelText) });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 365 || days.length > 371) throw new Error('Expected a complete yearly calendar.');
  for (let i = 1; i < days.length; i++) {
    if (Date.parse(days[i].date) - Date.parse(days[i - 1].date) !== DAY) {
      throw new Error('Calendar dates are duplicated or incomplete.');
    }
  }
  if (days.reduce((sum, day) => sum + day.count, 0) !== total) {
    throw new Error('Calendar counts disagree with GitHub contribution total.');
  }
  return { total, days };
}

export function summarizeRepositories(repositories) {
  if (!Array.isArray(repositories) || repositories.some((repo) => (
    repo.owner?.login?.toLowerCase() !== USERNAME || repo.private !== false
    || !Number.isSafeInteger(repo.stargazers_count) || repo.stargazers_count < 0
    || typeof repo.fork !== 'boolean'
  ))) throw new Error('Unexpected public repository data.');
  return {
    repositories: repositories.length,
    stars: repositories.filter((repo) => !repo.fork).reduce((sum, repo) => sum + repo.stargazers_count, 0),
  };
}

export function renderActivity(snapshot, theme) {
  const p = theme === 'dark'
    ? { bg: '#101b1d', line: '#2c3e40', text: '#f1f6f2', muted: '#afc1c0', accent: '#9ee6c1', levels: ['#1d2d2a', '#2d5846', '#428464', '#6cb68d', '#9ee6c1'] }
    : { bg: '#f5f7f2', line: '#d0d9cf', text: '#172f29', muted: '#4f645b', accent: '#236b51', levels: ['#e0e8de', '#c0dbbf', '#89b88d', '#4b9265', '#236b51'] };
  const { calendar } = snapshot;
  const firstDay = Date.parse(calendar.days[0].date);
  const start = firstDay - new Date(firstDay).getUTCDay() * DAY;
  const months = [];
  let lastLabelX = -100;
  const squares = calendar.days.map((day) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const week = Math.floor((date - start) / DAY / 7);
    const x = 124 + week * 20;
    const y = 222 + date.getUTCDay() * 20;
    if ((date.getUTCDate() === 1 || day === calendar.days[0]) && x - lastLabelX >= 36) {
      months.push(`<text x="${x}" y="207">${date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`);
      lastLabelX = x;
    }
    return `<rect x="${x}" y="${y}" width="15" height="15" rx="3" fill="${p.levels[day.level]}"><title>${day.date}: ${day.count} contributions</title></rect>`;
  });
  const updated = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(snapshot.fetchedAt));
  const format = (value) => new Intl.NumberFormat('en-US').format(value);
  const title = `GitHub activity — ${format(calendar.total)} contributions shown in the last year`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="488" viewBox="0 0 1280 488" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">Snapshot for ${USERNAME}. ${snapshot.repositories} public repositories, ${snapshot.stars} stars on owned non-fork repositories. Calendar ${calendar.days[0].date} to ${calendar.days.at(-1).date}. Updated ${escapeXml(updated)} (UTC+7). A decorative football rolls below the calendar without changing the data.</desc>
  <defs>
    <clipPath id="ball-clip"><circle r="22"/></clipPath>
    <style>
      .ball-travel{animation:roll-across 12s linear infinite alternate}
      .ball-spin{animation:roll-spin 12s linear infinite alternate;transform-origin:0px 0px}
      @keyframes roll-across{from{transform:translateX(0px)}to{transform:translateX(1024px)}}
      @keyframes roll-spin{from{transform:rotate(0deg)}to{transform:rotate(2667deg)}}
      @media(prefers-reduced-motion:reduce){.ball-travel,.ball-spin{animation:none}}
    </style>
  </defs>
  <rect x=".5" y=".5" width="1279" height="487" rx="16" fill="${p.bg}" stroke="${p.line}"/>
  <g font-family="Consolas,'Courier New',monospace" fill="${p.accent}" font-size="14" letter-spacing="2">
    <text x="48" y="40">BUILD LOG / GITHUB ACTIVITY</text>
    <text x="1232" y="40" text-anchor="end" fill="${p.muted}" letter-spacing="0">@${USERNAME}</text>
  </g>
  <g font-family="'Segoe UI',Arial,sans-serif">
    <g fill="${p.text}" font-size="56" font-weight="650">
      <text x="48" y="119">${format(calendar.total)}</text>
      <text x="508" y="119">${format(snapshot.repositories)}</text>
      <text x="916" y="119">${format(snapshot.stars)}</text>
    </g>
    <g fill="${p.muted}" font-size="17">
      <text x="48" y="150">Contributions shown · last year</text>
      <text x="508" y="150">Public repositories</text>
      <text x="916" y="150">Stars · owned non-fork repos</text>
    </g>
  </g>
  <path d="M460 80V150M868 80V150M48 174H1232M48 363H1232M48 447H1232" stroke="${p.line}"/>
  <g font-family="Consolas,monospace" fill="${p.muted}" font-size="12">
    ${months.join('\n    ')}
    <text x="72" y="254">Mon</text><text x="72" y="294">Wed</text><text x="72" y="334">Fri</text>
  </g>
  ${squares.join('\n  ')}
  <path d="M124 436H1196" stroke="${p.line}" stroke-width="2" stroke-linecap="round"/>
  <g transform="translate(144 414)">
    <g class="ball-travel">
      <g class="ball-spin">
        <title>Rolling football</title>
        <circle r="22" fill="#f1f6f2"/>
        <g clip-path="url(#ball-clip)" fill="#243d33" stroke="#243d33" stroke-linejoin="round">
          <path d="M0-9L9-3L6 7H-6L-9-3Z"/>
          <path d="M-22-6L-15-8L-14 0L-21 6ZM22-6L15-8L14 0L21 6ZM-13 18L-9 12L-2 17L-4 22ZM13 18L9 12L2 17L4 22ZM-4-22L-3-15L4-14L10-20Z"/>
          <path d="M0-9L-3-17M9-3L18-6M6 7L10 15M-6 7L-10 15M-9-3L-18-6" fill="none" stroke-width="1.2"/>
        </g>
        <circle r="22" fill="none" stroke="${p.accent}" stroke-width="1.5"/>
      </g>
    </g>
  </g>
  <g font-family="Consolas,monospace" font-size="12" fill="${p.muted}">
    <text x="1020" y="471">Less</text>
    ${p.levels.map((color, i) => `<rect x="1060" y="460" width="12" height="12" rx="2" fill="${color}" transform="translate(${i * 19} 0)"/>`).join('')}
    <text x="1166" y="471">More</text>
  </g>
</svg>
`;
}

async function request(url, json = false) {
  const response = await fetch(url, {
    headers: { 'User-Agent': `${USERNAME}-profile`, ...(json ? { Accept: 'application/vnd.github+json' } : {}) },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status} for ${url}`);
  return json ? response.json() : response.text();
}

async function fetchRepositories() {
  const repositories = [];
  for (let page = 1; ; page++) {
    const batch = await request(`https://api.github.com/users/${USERNAME}/repos?type=owner&per_page=100&page=${page}`, true);
    if (!Array.isArray(batch)) throw new Error('GitHub repository response is not an array.');
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
    if (page >= 100) throw new Error('Repository pagination exceeded the safety limit.');
  }
}

export async function updateActivity() {
  const [html, repositories] = await Promise.all([
    request(`https://github.com/users/${USERNAME}/contributions`), fetchRepositories(),
  ]);
  // Finish fetching, validating and rendering before touching existing assets.
  const snapshot = {
    username: USERNAME,
    fetchedAt: new Date().toISOString(),
    sources: {
      calendar: `https://github.com/users/${USERNAME}/contributions`,
      repositories: `https://api.github.com/users/${USERNAME}/repos?type=owner&per_page=100`,
    },
    ...summarizeRepositories(repositories),
    calendar: parseContributionCalendar(html),
  };
  const dark = renderActivity(snapshot, 'dark');
  const light = renderActivity(snapshot, 'light');
  const data = JSON.stringify(snapshot, null, 2) + '\n';
  await mkdir(ASSETS, { recursive: true });
  await writeFile(new URL('activity-dark.svg', ASSETS), dark, 'utf8');
  await writeFile(new URL('activity-light.svg', ASSETS), light, 'utf8');
  await writeFile(new URL('activity.json', ASSETS), data, 'utf8');
  console.log(`Updated activity: ${snapshot.calendar.total} contributions, ${snapshot.repositories} public repos, ${snapshot.stars} stars.`);
  console.log(`Assets: ${fileURLToPath(ASSETS)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  updateActivity().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
