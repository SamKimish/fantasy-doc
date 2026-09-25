// Snapshots ESPN's injury commentary and accumulates each player's practice trail for the NFL week.
// Run by .github/workflows/practice-snapshot.yml; usage: node scripts/snapshot.js <path/to/practice.json>
//
// ESPN only keeps each player's latest news item, so the Wednesday report is overwritten once Thursday's
// arrives. Running this every couple of hours and merging the days we see builds the full Wed/Thu/Fri trail.
const fs = require("fs");
const { parseTrail, playerKey } = require("../practice.js");

const SLEEPER_STATE = "https://api.sleeper.app/v1/state/nfl";
const ESPN_INJURIES = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries";

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: node scripts/snapshot.js <practice.json>");

  const [state, feed] = await Promise.all([getJSON(SLEEPER_STATE), getJSON(ESPN_INJURIES)]);
  const teams = feed.injuries || [];
  if (!teams.length) throw new Error("ESPN feed came back empty; leaving the snapshot untouched");

  let data = null;
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
  // a new NFL week starts a fresh trail
  if (!data || data.season !== state.season || data.week !== state.week) {
    data = { season: state.season, week: state.week, updated: null, players: {} };
  }

  const before = JSON.stringify(data.players);
  for (const team of teams) {
    for (const item of team.injuries || []) {
      const athlete = item.athlete || {};
      if (!athlete.displayName) continue;
      const trail = parseTrail(`${item.shortComment || ""} ${item.longComment || ""}`);
      if (!Object.keys(trail).length) continue;
      // newer sightings overwrite older ones for the same day; days we've already seen are never dropped
      const key = playerKey(athlete.displayName, athlete.team && athlete.team.abbreviation);
      data.players[key] = { ...(data.players[key] || {}), ...trail };
    }
  }

  if (JSON.stringify(data.players) === before && data.updated) {
    console.log("No change.");
    return;
  }
  data.updated = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(data));
  console.log(`Week ${data.week}: ${Object.keys(data.players).length} players with a practice trail.`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
