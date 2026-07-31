function normalizeSubmission(value) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function checkShortAnswer(expected, actual) {
  if (!actual.trim()) return false;
  return normalizeSubmission(expected) === normalizeSubmission(actual);
}
