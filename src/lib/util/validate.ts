const numberlike = /^-?\d+$/;
const formulaic = /^(?:-?\d*d?\d+)(?:\s*\*\s*(?:-?\d*d?\d+))*(?:\s*[+-]\s*(?:-?\d*d?\d+)(?:\s*\*\s*(?:-?\d*d?\d+))*)*$/;

export function isNumeric(potential: string) {
  return numberlike.test(potential);
}

export function isRollFormula(potential: string) {
  return formulaic.test(potential);
}