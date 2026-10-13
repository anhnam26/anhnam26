import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseContributionCalendar, summarizeRepositories, renderActivity, updateActivity } from './update-activity.mjs';

function calendarHtml(total=1234) {
  const formatted=new Intl.NumberFormat('en-US').format(total);
  const days = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10);
    return `<td data-level="${i === 0 ? 4 : 0}" id="day-${i}" data-date="${date}"></td>
      <tool-tip for="day-${i}">${i === 0 ? formatted : 'No'} contributions on a date.</tool-tip>`;
  }).join('\n');
  return `<h2 id="js-contribution-activity-description">${formatted} contributions in the last year</h2>${days}`;
}

test('calendar parses comma-separated totals, sorts dates and retains intensity', () => {
  const calendar = parseContributionCalendar(calendarHtml());
  assert.equal(calendar.total, 1234);
  assert.deepEqual(calendar.days[0], { date: '2025-01-01', count: 1234, level: 4 });
  assert.deepEqual(calendar.days.at(-1), { date: '2025-12-31', count: 0, level: 0 });
});

test('changed markup and unavailable counts fail instead of becoming zero', () => {
  assert.throws(() => parseContributionCalendar('<html>Unavailable</html>'), /total is missing/);
  assert.throws(() => parseContributionCalendar(calendarHtml().replace('for="day-2"', 'for="unknown"')), /Invalid contribution cell/);
});

test('incomplete or duplicated dates and mismatched totals are rejected', () => {
  assert.throws(() => parseContributionCalendar(calendarHtml().replace('data-date="2025-01-02"', 'data-date="2025-01-01"')), /duplicated or incomplete/);
  assert.throws(() => parseContributionCalendar(calendarHtml().replace('1,234 contributions in', '1,235 contributions in')), /counts disagree/);
  assert.throws(() => parseContributionCalendar(calendarHtml().replace('data-level="0"', 'data-level="9"')), /Invalid contribution cell/);
});

test('repository stars exclude forks and reject foreign or private repositories', () => {
  const repo = { owner: { login: 'anhnam26' }, private: false, fork: false, stargazers_count: 9 };
  assert.deepEqual(summarizeRepositories([repo, { ...repo, fork: true, stargazers_count: 300 }]), { repositories: 2, stars: 9 });
  assert.throws(() => summarizeRepositories([{ ...repo, private: true }]), /Unexpected/);
  assert.throws(() => summarizeRepositories([{ ...repo, owner: { login: 'someone-else' } }]), /Unexpected/);
});

test('render keeps year boundaries in bounds and uses Vietnam snapshot date', () => {
  const snapshot = { fetchedAt: '2026-10-12T18:00:00Z', repositories: 6, stars: 9, calendar: parseContributionCalendar(calendarHtml()) };
  for (const theme of ['light', 'dark']) {
    const svg = renderActivity(snapshot, theme);
    assert.match(svg, /Updated 13 Oct 2026/);
    assert.doesNotMatch(svg, /<text[^>]*>SNAPSHOT/);
    assert.match(svg, /2025-01-01: 1234 contributions/);
    assert.match(svg, /2025-12-31: 0 contributions/);
    const cells = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="15" height="15"/g)];
    assert.equal(cells.length, 365);
    assert.ok(cells.every(([, x, y]) => Number(x) + 15 <= 1232 && Number(y) + 15 < 363));
    assert.ok(!/<script|foreignObject|\b(?:href|src)="https?:/.test(svg));
    assert.match(svg, /viewBox="0 0 1184 666"/);
    assert.match(svg, /Blue wins football 3-2, red wins basketball 3-2, blue wins volleyball 3-2/);
    assert.match(svg, /FULL TIME \/ BLUE WINS/);
    assert.match(svg, /FULL TIME \/ RED WINS/);
    assert.ok(Buffer.byteLength(svg)<5_000_000,'Keep the full four-minute SVG below 5 MB');
  }
});

test('automated refresh authenticates only the REST API and publishes validated data', async (t) => {
  const tempRoot = resolve(tmpdir());
  const directory = await mkdtemp(join(tempRoot, 'profile-activity-'));
  assert.equal(dirname(resolve(directory)), tempRoot);
  t.after(() => rm(directory, { recursive: true, force: true }));
  const calls = [];
  let stars = 9;
  let contributions = 1234;
  const fetchImpl = async (url, options) => {
    calls.push({ url, headers: options.headers });
    const body = url.startsWith('https://api.github.com/')
      ? [{ owner: { login: 'anhnam26' }, private: false, fork: false, stargazers_count: stars }]
      : calendarHtml(contributions);
    return { ok: true, json: async () => body, text: async () => body };
  };
  const assets = pathToFileURL(directory + '/');
  const readme=pathToFileURL(join(directory,'README.md'));
  const profile='<img src="assets/hero-dark.svg">\n<picture><source srcset="assets/activity-light.svg"><img src="assets/activity-dark.svg"></picture>\nhttps://github.com/user-attachments/assets/example\n';
  await writeFile(readme,profile);
  await updateActivity({ assets, readme, fetchImpl, token: 'test-only-token', now: () => new Date('2026-10-13T18:00:00Z') });
  const firstReadme=await readFile(readme,'utf8');
  assert.match(firstReadme,/activity-dark\.svg\?v=[a-f0-9]{16}/,'Images need a versioned URL to avoid stale cached numbers');
  assert.equal(firstReadme.replace(/\?v=[a-f0-9]{16}/g,''),profile,'Keep the rest of the profile unchanged');
  const snapshot = JSON.parse(await readFile(join(directory, 'activity.json'), 'utf8'));
  assert.equal(snapshot.calendar.total, 1234);
  assert.equal(snapshot.repositories, 1);
  assert.equal(snapshot.stars, 9);
  assert.equal(snapshot.fetchedAt, '2026-10-13T18:00:00.000Z');
  assert.equal(calls.find(call => call.url.startsWith('https://api.github.com/')).headers.Authorization, 'Bearer test-only-token');
  assert.equal(calls.find(call => call.url.startsWith('https://github.com/')).headers.Authorization, undefined);
  for (const file of ['activity.json', 'activity-dark.svg', 'activity-light.svg']) {
    assert.ok(!(await readFile(join(directory, file), 'utf8')).includes('test-only-token'));
  }

  // Identical polls retain the published timestamp and all output bytes.
  const before = await Promise.all(['activity.json', 'activity-dark.svg', 'activity-light.svg'].map(file => readFile(join(directory, file), 'utf8')));
  await updateActivity({ assets, readme, fetchImpl, token: 'test-only-token', now: () => new Date('2026-10-13T19:00:00Z') });
  const after = await Promise.all(['activity.json', 'activity-dark.svg', 'activity-light.svg'].map(file => readFile(join(directory, file), 'utf8')));
  assert.deepEqual(after, before);
  assert.equal(await readFile(readme,'utf8'),firstReadme,'Unchanged polls must not churn image URLs');

  await writeFile(join(directory, 'activity-dark.svg'), '<svg>outdated design</svg>');
  await updateActivity({ assets, fetchImpl, now: () => new Date('2026-10-13T19:30:00Z') });
  assert.equal(await readFile(join(directory, 'activity-dark.svg'), 'utf8'), before[1], 'Unchanged data must still rebuild the current design');

  stars = 10;
  await updateActivity({ assets, readme, fetchImpl, now: () => new Date('2026-10-13T20:00:00Z') });
  const changed = JSON.parse(await readFile(join(directory, 'activity.json'), 'utf8'));
  assert.equal(changed.stars, 10);
  assert.equal(changed.fetchedAt, '2026-10-13T20:00:00.000Z');
  const beforeContributionIncrease=await readFile(readme,'utf8');
  contributions=1235;
  await updateActivity({assets,readme,fetchImpl,now:()=>new Date('2026-10-13T20:05:00Z')});
  assert.notEqual(await readFile(readme,'utf8'),beforeContributionIncrease,'An increased contribution count must change the image URL');
  assert.equal(JSON.parse(await readFile(join(directory,'activity.json'),'utf8')).calendar.total,1235);
  assert.match(await readFile(join(directory,'activity-dark.svg'),'utf8'),/>1,235<\/text>/);
  const beforeFailure = await Promise.all(['activity.json', 'activity-dark.svg', 'activity-light.svg','README.md'].map(file => readFile(join(directory, file), 'utf8')));

  await assert.rejects(updateActivity({ assets, readme, fetchImpl: async () => ({ ok: false, status: 503 }), token: '' }), /HTTP 503/);
  const afterFailure = await Promise.all(['activity.json', 'activity-dark.svg', 'activity-light.svg','README.md'].map(file => readFile(join(directory, file), 'utf8')));
  assert.deepEqual(afterFailure, beforeFailure, 'A failed refresh must keep the published assets');
});
