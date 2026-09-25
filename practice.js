/*
 * Reads practice-participation wording out of ESPN injury commentary, e.g.
 *   "Melton (toe) missed Wednesday's practice ... was a limited participant in Thursday's practice."
 * and returns { Wed: "red", Thu: "yellow" }.
 *   green  = full participation
 *   yellow = limited
 *   red    = did not practice
 * Shared by the web page (window.Practice) and the snapshot job (require).
 */
(function (root) {
  const DAYS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri" };
  const DAY_RE = /\b(monday|tuesday|wednesday|thursday|friday)\b/gi;
  // A sentence only counts if it is about practice, so "limited to 30 snaps in Thursday's game" is ignored.
  const PRACTICE_WORD = /practic|particip|estimate|injury report|\bDNP\b/i;
  const RED = /did not (?:practice|participate|take part|train)|didn['’]t (?:practice|participate|take part|train)|non-?participant|\bDNP\b|\bmissed\b|sat out|held out|not (?:spotted|seen|present|able to practice)|wasn['’]t (?:spotted|seen|present)|\babsent\b|no practice|(?:not|isn['’]t|aren['’]t) practicing/i;
  const YELLOW = /\blimited\b|on a limited basis/i;
  const GREEN = /\bfull(?:y)?\b|without (?:any )?limitations/i; // only reached in a practice sentence that names a day

  // "did not appear on the injury report" means healthy, i.e. full participation
  const levelOf = (text) => (/did not appear on/i.test(text) ? "green" : RED.test(text) ? "red" : YELLOW.test(text) ? "yellow" : GREEN.test(text) ? "green" : null);

  function parseTrail(text) {
    const out = {};
    for (const sentence of String(text || "").match(/[^.!?]+[.!?]*/g) || []) {
      if (!PRACTICE_WORD.test(sentence)) continue;
      let carry = null; // "limited Wednesday and Thursday": the second day inherits the level
      for (const part of sentence.split(/;|,?\s+(?:but|then|before|and|while|whereas)\s+/i)) {
        const days = [...part.matchAll(DAY_RE)].map((m) => DAYS[m[1].toLowerCase()]);
        if (!days.length) continue;
        const level = levelOf(part) || (part.length < 40 ? carry : null);
        if (!level) continue;
        carry = level;
        for (const d of days) if (!out[d]) out[d] = level; // first mention wins: news leads with the latest day
      }
    }
    return out;
  }

  // Sleeper often has no ESPN id, so players are matched by name + team ("Dadrion Taylor-Demerson" + ARI).
  const TEAM_FIX = { WSH: "WAS" }; // ESPN -> Sleeper
  function playerKey(name, team) {
    const clean = String(name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z ]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/\s+/g, " ").trim();
    return `${clean}|${TEAM_FIX[team] || team || ""}`;
  }

  const api = { parseTrail, playerKey };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Practice = api;
})(typeof window !== "undefined" ? window : globalThis);
