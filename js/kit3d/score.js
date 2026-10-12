// Shared scoring for the full-3D worlds: the arcade profile, high scores and GitHub score posts.
// Uses the same localStorage keys as the canvas engine (js/engine/08-scores.js), so tokens, wins and
// best scores show up in the hub, and the same issue title format, so the hub leaderboard reads them.
export const REPO = 'Normansrule/pixel-arcade';
const PROFILE = 'pxd_profile';

function load() {
  try { return JSON.parse(localStorage.getItem(PROFILE)) || { user: '', tokens: 0, played: 0, wins: 0 }; }
  catch (e) { return { user: '', tokens: 0, played: 0, wins: 0 }; }
}

/** The player's GitHub username from the hub profile chip, or ''. */
export function userName() { return load().user || ''; }

/** localStorage key of this player's best score for a game id. */
export function bestKey(id) { const u = userName(); return 'pxd_hs_' + (u ? u.toLowerCase() + '_' : '') + id; }

/** This player's best score for a game id (0 when none). */
export function bestScore(id) { try { return +(localStorage.getItem(bestKey(id)) || 0); } catch (e) { return 0; } }

/** Keep pts as the best score for id if it beats the stored one. */
export function saveBest(id, pts) { try { const k = bestKey(id); if (+(localStorage.getItem(k) || 0) < pts) localStorage.setItem(k, pts); } catch (e) {} }

/** Count a finished round on the arcade profile: one more played, tokens earned, and a win if won. */
export function addRound(tokens, won) {
  try { const p = load(); p.played = (p.played || 0) + 1; p.tokens = (p.tokens || 0) + tokens; if (won) p.wins = (p.wins || 0) + 1; localStorage.setItem(PROFILE, JSON.stringify(p)); } catch (e) {}
}

/** Open a prefilled GitHub issue titled "[score] <id> <pts>"; body is the issue text. */
export function postScore(id, pts, body) {
  open('https://github.com/' + REPO + '/issues/new?title=' + encodeURIComponent('[score] ' + id + ' ' + pts) + '&body=' + encodeURIComponent(body), '_blank');
}
