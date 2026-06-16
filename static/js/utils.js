/* ========== Utility Functions ========== */

/**
 * Fisher-Yates shuffle - returns new shuffled array
 */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Check if selected answer matches the correct answer
 * @param {object} question
 * @param {string[]} selected - array of selected labels
 * @returns {{ correct: boolean }}
 */
function checkAnswer(question, selected) {
  const correctSet = new Set(question.answer);
  const selectedSet = new Set(selected);
  const correct =
    correctSet.size === selectedSet.size &&
    [...correctSet].every((l) => selectedSet.has(l));
  return { correct };
}

/**
 * Calculate score from results
 * @param {Array} results - [{ correct: boolean }, ...]
 * @returns {{ score: number, total: number, percentage: number }|null}
 */
function calculateScore(results) {
  if (!results || !results.length) return null;
  const total = results.length;
  const score = results.filter((r) => r.correct).length;
  return {
    score,
    total,
    percentage: Math.round((score / total) * 100),
  };
}

/**
 * Persist exam state to localStorage
 */
function saveState(state) {
  try {
    localStorage.setItem("examState", JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

/**
 * Load exam state from localStorage
 */
function loadState() {
  try {
    const data = localStorage.getItem("examState");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Clear exam state from localStorage
 */
function clearState() {
  try {
    localStorage.removeItem("examState");
  } catch (e) {
    // ignore
  }
}

/**
 * Capitalize first letter
 */
function ucfirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
