/**
 * Smart Vietnamese Search Utility
 * Provides intelligent accent-aware and word-boundary-aware search matching
 * for Vietnamese names, phone numbers, and appointment codes.
 */

/**
 * Strips tone marks (\u0300, \u0301, \u0303, \u0309, \u0323) while keeping base letters (â, ă, ê, ô, ơ, ư, đ).
 */
export const stripToneMarks = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
    .normalize('NFC')
    .toLowerCase();
};

/**
 * Strips all diacritical marks (including â -> a, ă -> a, đ -> d, etc.)
 */
export const stripAllAccents = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

/**
 * Smart Vietnamese search matching function.
 * Evaluates whether `targetStr` matches `queryStr` and returns a relevance score (> 0 if matches, 0 if no match).
 */
export const getSmartSearchScore = (targetStr: string, queryStr: string): number => {
  if (!targetStr || !queryStr) return 0;

  const rawTarget = targetStr.trim().toLowerCase();
  const rawQuery = queryStr.trim().toLowerCase();
  if (!rawQuery) return 100;

  const toneTarget = stripToneMarks(rawTarget);
  const toneQuery = stripToneMarks(rawQuery);

  const cleanTarget = stripAllAccents(rawTarget);
  const cleanQuery = stripAllAccents(rawQuery);

  // 1. Exact full name match
  if (rawTarget === rawQuery) return 100;
  if (toneTarget === toneQuery) return 98;
  if (cleanTarget === cleanQuery) return 95;

  const targetWordsRaw = rawTarget.split(/\s+/);
  const targetWordsTone = toneTarget.split(/\s+/);
  const targetWordsClean = cleanTarget.split(/\s+/);

  const queryWordsRaw = rawQuery.split(/\s+/);
  const queryWordsTone = toneQuery.split(/\s+/);
  const queryWordsClean = cleanQuery.split(/\s+/);

  // 2. Multi-word phrase matching
  if (queryWordsClean.length > 1) {
    if (rawTarget.includes(rawQuery)) return 92;
    if (toneTarget.includes(toneQuery)) return 88;
    if (cleanTarget.includes(cleanQuery)) return 84;
  }

  // 3. Word-by-word matching
  let totalScore = 0;
  let matchedQueryWords = 0;

  for (let qIdx = 0; qIdx < queryWordsClean.length; qIdx++) {
    const qClean = queryWordsClean[qIdx];
    const qTone = queryWordsTone[qIdx] || qClean;
    const qRaw = queryWordsRaw[qIdx] || qClean;

    let bestWordScore = 0;

    for (let i = 0; i < targetWordsClean.length; i++) {
      const tClean = targetWordsClean[i] || '';
      const tTone = targetWordsTone[i] || '';
      const tRaw = targetWordsRaw[i] || '';

      // Exact word match (e.g. word "an" === "an")
      if (tRaw === qRaw || tTone === qTone) {
        bestWordScore = Math.max(bestWordScore, 90);
      } else if (tClean === qClean) {
        // Accent-free word match (e.g. "ngan" === "ngan")
        bestWordScore = Math.max(bestWordScore, 80);
      }
      // Word starts with query (e.g. "antigravity" starts with "an")
      else if (tRaw.startsWith(qRaw) || tTone.startsWith(qTone) || tClean.startsWith(qClean)) {
        bestWordScore = Math.max(bestWordScore, 70);
      }
      // Substring inside a single word ONLY if query word length >= 4 (e.g. "cuong" inside "dinhcuong")
      else if (qClean.length >= 4 && (tRaw.includes(qRaw) || tTone.includes(qTone) || tClean.includes(qClean))) {
        bestWordScore = Math.max(bestWordScore, 40);
      }
    }

    if (bestWordScore > 0) {
      matchedQueryWords++;
      totalScore += bestWordScore;
    }
  }

  if (matchedQueryWords === queryWordsClean.length && queryWordsClean.length > 0) {
    return Math.round(totalScore / queryWordsClean.length);
  }

  return 0;
};

/**
 * Returns true if targetStr matches queryStr under smart Vietnamese search rules.
 */
export const matchesSmartSearch = (targetStr: string, queryStr: string): boolean => {
  return getSmartSearchScore(targetStr, queryStr) > 0;
};
