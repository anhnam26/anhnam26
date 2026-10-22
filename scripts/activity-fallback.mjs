import {readFile} from 'node:fs/promises';

const SNAPSHOT_URL='https://raw.githubusercontent.com/anhnam26/anhnam26/main/assets/activity.json';
const DAY=86_400_000;

// Published JSON is an external input. Never render fabricated totals, another
// account, invalid dates, or a partially written contribution calendar.
export function validateActivitySnapshot(snapshot) {
  const {username,fetchedAt,repositories,stars,calendar}=snapshot??{};
  const nonnegative=value=>Number.isSafeInteger(value)&&value>=0;
  if(username!=='anhnam26'||typeof fetchedAt!=='string'||!Number.isFinite(Date.parse(fetchedAt))
    ||!nonnegative(repositories)||!nonnegative(stars)||!nonnegative(calendar?.total)
    ||!Array.isArray(calendar.days)||calendar.days.length<365||calendar.days.length>371) {
    throw new Error('Invalid saved activity snapshot.');
  }
  let previous,total=0;
  for(const {date,count,level} of calendar.days) {
    const time=Date.parse(`${date}T00:00:00Z`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(time)
      ||new Date(time).toISOString().slice(0,10)!==date
      ||!nonnegative(count)||!Number.isInteger(level)||level<0||level>4
      ||(previous!==undefined&&time-previous!==DAY)) throw new Error('Invalid saved contribution calendar.');
    previous=time;total+=count;
  }
  if(total!==calendar.total) throw new Error('Saved contribution total does not match the calendar.');
  return snapshot;
}

export async function loadPublishedSnapshot({fetchImpl=fetch}={}) {
  try {
    const response=await fetchImpl(SNAPSHOT_URL,{
      cache:'no-store',redirect:'error',signal:AbortSignal.timeout(1000),
      headers:{'User-Agent':'anhnam26-profile','Cache-Control':'no-cache'},
    });
    if(!response.ok) throw new Error('Saved snapshot unavailable.');
    return validateActivitySnapshot(await response.json());
  } catch {
    // A cold function still has a known, validated snapshot even if both GitHub
    // hosts are unavailable. This file is bundled explicitly with the function.
    return validateActivitySnapshot(JSON.parse(await readFile(new URL('../assets/activity.json',import.meta.url),'utf8')));
  }
}
