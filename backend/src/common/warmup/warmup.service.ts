import { Injectable, Logger } from '@nestjs/common';

/**
 * Configuration for warmup set calculation
 */
export interface WarmupConfig {
  /** Percentage of working load for each warmup set (e.g., [0.5, 0.6, 0.7] for 50%, 60%, 70%) */
  loadPercentages: number[];
  /** Recommended reps for each warmup set (must match length of loadPercentages) */
  repsPerSet: number[];
  /** Default working load to use when no history exists (in kg) */
  defaultWorkingLoad: number;
}

/**
 * Represents a single warmup set suggestion
 */
export interface WarmupSetSuggestion {
  /** Recommended load in kg, rounded to 1 decimal place */
  load: number;
  /** Recommended repetitions for this warmup set */
  reps: number;
  /** Percentage of working load this represents */
  percentage: number;
}

/**
 * Default warmup configuration following progressive loading pattern
 * Suitable for most compound exercises (squat, bench, deadlift, etc.)
 */
const DEFAULT_WARMUP_CONFIG: WarmupConfig = {
  loadPercentages: [0.4, 0.5, 0.6, 0.7, 0.8],
  repsPerSet: [8, 6, 5, 3, 2],
  defaultWorkingLoad: 60, // Default assumption: 60kg working weight if no history
};

/**
 * WarmupService - generates intelligent warmup set recommendations
 *
 * This service calculates warmup sets based on historical working loads,
 * following progressive loading patterns commonly used in strength training.
 */
@Injectable()
export class WarmupService {
  private readonly logger = new Logger(WarmupService.name);
  private readonly config: WarmupConfig;

  constructor() {
    // Use default configuration
    this.config = DEFAULT_WARMUP_CONFIG;

    this.logger.log('WarmupService initialized with config:', this.config);
  }

  /**
   * Calculate warmup set suggestions based on working load
   *
   * @param workingLoad - The target working load in kg (from history or plan)
   * @param numberOfWarmupSets - How many warmup sets to generate
   * @returns Array of warmup set suggestions
   */
  calculateWarmupSets(
    workingLoad: number | null | undefined,
    numberOfWarmupSets: number,
  ): WarmupSetSuggestion[] {
    // Guard clause: validate numberOfWarmupSets
    if (numberOfWarmupSets <= 0) {
      this.logger.debug(
        'No warmup sets requested (numberOfWarmupSets <= 0), returning empty array',
      );
      return [];
    }

    // Guard clause: use default if no working load provided
    const effectiveWorkingLoad =
      workingLoad && workingLoad > 0
        ? workingLoad
        : this.config.defaultWorkingLoad;

    this.logger.debug(
      `Calculating ${numberOfWarmupSets} warmup sets for working load: ${effectiveWorkingLoad}kg`,
    );

    // Select the appropriate warmup percentages based on requested number
    const selectedPercentages =
      this.selectWarmupPercentages(numberOfWarmupSets);
    const selectedReps = this.selectWarmupReps(numberOfWarmupSets);

    // Generate warmup set suggestions
    const suggestions: WarmupSetSuggestion[] = selectedPercentages.map(
      (percentage, index) => {
        const calculatedLoad = effectiveWorkingLoad * percentage;
        const roundedLoad = this.roundToNearestIncrement(calculatedLoad, 2.5);

        return {
          load: Number(roundedLoad.toFixed(1)),
          reps: selectedReps[index],
          percentage: Math.round(percentage * 100),
        };
      },
    );

    this.logger.debug('Generated warmup suggestions:', suggestions);

    return suggestions;
  }

  /**
   * Calculate warmup sets based on historical data
   *
   * @param recentWorkingLoads - Array of recent working loads from workout history
   * @param numberOfWarmupSets - How many warmup sets to generate
   * @returns Array of warmup set suggestions
   */
  calculateFromHistory(
    recentWorkingLoads: number[],
    numberOfWarmupSets: number,
  ): WarmupSetSuggestion[] {
    // Guard clause: handle empty history
    if (!recentWorkingLoads || recentWorkingLoads.length === 0) {
      this.logger.debug(
        'No workout history available, using default working load',
      );
      return this.calculateWarmupSets(null, numberOfWarmupSets);
    }

    // Use the most recent working load as reference
    const mostRecentLoad = recentWorkingLoads[0];

    this.logger.debug(
      `Calculating warmup from history. Most recent load: ${mostRecentLoad}kg`,
    );

    return this.calculateWarmupSets(mostRecentLoad, numberOfWarmupSets);
  }

  /**
   * Select appropriate warmup percentages based on number of sets requested
   * Uses the final N percentages from config (highest intensity warmups)
   */
  private selectWarmupPercentages(numberOfWarmupSets: number): number[] {
    const totalAvailable = this.config.loadPercentages.length;

    // If requesting more sets than configured, return all available
    if (numberOfWarmupSets >= totalAvailable) {
      return this.config.loadPercentages;
    }

    // Return the last N percentages (highest intensity warmups)
    return this.config.loadPercentages.slice(-numberOfWarmupSets);
  }

  /**
   * Select appropriate reps based on number of sets requested
   * Corresponds to selected percentages
   */
  private selectWarmupReps(numberOfWarmupSets: number): number[] {
    const totalAvailable = this.config.repsPerSet.length;

    // If requesting more sets than configured, return all available
    if (numberOfWarmupSets >= totalAvailable) {
      return this.config.repsPerSet;
    }

    // Return the last N reps (corresponds to highest intensity warmups)
    return this.config.repsPerSet.slice(-numberOfWarmupSets);
  }

  /**
   * Round load to nearest practical weight increment
   * Common plate increments are 2.5kg (5kg total with both sides)
   *
   * @param load - Raw calculated load
   * @param increment - Rounding increment (default 2.5kg)
   * @returns Rounded load
   */
  private roundToNearestIncrement(load: number, increment: number): number {
    // For very light loads (under 20kg), use smaller increment
    if (load < 20) {
      increment = 1.25;
    }

    return Math.round(load / increment) * increment;
  }
}
