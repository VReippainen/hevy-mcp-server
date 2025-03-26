/**
 * Utility functions for calculating estimated one-rep max (1RM)
 * based on weight and repetitions performed.
 *
 * Implements four common formulas:
 * 1. Brzycki: Weight × (36 / (37 - reps))
 * 2. Epley: Weight × (1 + (0.0333 × reps))
 * 3. Lombardi: Weight × (reps ^ 0.1)
 * 4. O'Conner: Weight × (1 + (0.025 × reps))
 *
 * Note: These formulas are generally less accurate beyond 10-15 repetitions
 */

// Define formula types that can be used
export enum OneRepMaxFormula {
  BRZYCKI = 'brzycki',
  EPLEY = 'epley',
  LOMBARDI = 'lombardi',
  OCONNER = 'oconner',
}

/**
 * Calculates estimated one-rep max using the Brzycki formula
 * Weight × (36 / (37 - reps))
 */
export function brzyckiFormula(weight: number, reps: number): number {
  // For 1 rep, return the weight itself
  if (reps === 1) return weight;

  // The formula becomes undefined at reps = 37, so we need to handle this case
  if (reps >= 37) return weight * 36; // Theoretical maximum

  return weight * (36 / (37 - reps));
}

/**
 * Calculates estimated one-rep max using the Epley formula
 * Weight × (1 + (0.0333 × reps))
 */
export function epleyFormula(weight: number, reps: number): number {
  // For 1 rep, return the weight itself
  if (reps === 1) return weight;

  return weight * (1 + 0.0333 * reps);
}

/**
 * Calculates estimated one-rep max using the Lombardi formula
 * Weight × (reps ^ 0.1)
 */
export function lombardiFormula(weight: number, reps: number): number {
  // For 1 rep, return the weight itself
  if (reps === 1) return weight;

  return weight * Math.pow(reps, 0.1);
}

/**
 * Calculates estimated one-rep max using the O'Conner formula
 * Weight × (1 + (0.025 × reps))
 */
export function oconnerFormula(weight: number, reps: number): number {
  // For 1 rep, return the weight itself
  if (reps === 1) return weight;

  return weight * (1 + 0.025 * reps);
}

/**
 * Calculates the estimated one-rep max (1RM) using the specified formula.
 *
 * @param weight - The weight lifted in kg
 * @param reps - The number of repetitions performed
 * @param formula - The formula to use for calculation (default: Brzycki)
 * @param maxAllowedReps - Maximum number of reps to consider valid (default: 15)
 * @returns The calculated one-rep max or null if inputs are invalid
 */
export function calculateEstimated1RM(
  weight: number,
  reps: number,
  formula: OneRepMaxFormula = OneRepMaxFormula.BRZYCKI,
  maxAllowedReps: number = 15
): number | null {
  // Validate inputs
  if (weight <= 0) {
    return null; // Weight must be positive
  }

  if (reps <= 0 || !Number.isInteger(reps)) {
    return null; // Reps must be a positive integer
  }

  // If reps is 1, 1RM is just the weight itself
  if (reps === 1) {
    return weight;
  }

  // Apply accuracy limit
  if (reps > maxAllowedReps) {
    return null; // Beyond the reliable range for these formulas
  }

  // Calculate using the selected formula
  switch (formula) {
    case OneRepMaxFormula.BRZYCKI:
      return brzyckiFormula(weight, reps);
    case OneRepMaxFormula.EPLEY:
      return epleyFormula(weight, reps);
    case OneRepMaxFormula.LOMBARDI:
      return lombardiFormula(weight, reps);
    case OneRepMaxFormula.OCONNER:
      return oconnerFormula(weight, reps);
    default:
      return brzyckiFormula(weight, reps); // Default to Brzycki
  }
}
