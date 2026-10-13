import assert from 'node:assert/strict';
import test from 'node:test';
import { parseContributionCalendar, summarizeRepositories, renderActivity } from './update-activity.mjs';

function calendarHtml() {
  const days = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10);
    return `<td data-level="${i === 0 ? 4 : 0}" id="day-${i}" data-date="${date}"></td>
      <tool-tip for="day-${i}">${i === 0 ? '1,234' : 'No'} contributions on a date.</tool-tip>`;
  }).join('\n');
  return `<h2 id="js-contribution-activity-description">1,234 contributions in the last year</h2>${days}`;
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
    assert.match(svg, /13 OCT 2026/);
    assert.match(svg, /2025-01-01: 1234 contributions/);
    assert.match(svg, /2025-12-31: 0 contributions/);
    const cells = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="15" height="15"/g)];
    assert.equal(cells.length, 365);
    assert.ok(cells.every(([, x, y]) => Number(x) + 15 <= 1232 && Number(y) + 15 < 363));
    assert.ok(!/<script|foreignObject|\b(?:href|src)="https?:/.test(svg));
  }
});
