/** Generates a random 4-digit numeric PIN as a zero-padded string, e.g. "0472". */
export function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
