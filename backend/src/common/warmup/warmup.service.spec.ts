import { WarmupService } from './warmup.service';

describe('WarmupService', () => {
  let service: WarmupService;

  beforeEach(() => {
    service = new WarmupService();
  });

  describe('calculateWarmupSets', () => {
    it('should return empty array when numberOfWarmupSets is 0', () => {
      const result = service.calculateWarmupSets(100, 0);
      expect(result).toEqual([]);
    });

    it('should return empty array when numberOfWarmupSets is negative', () => {
      const result = service.calculateWarmupSets(100, -1);
      expect(result).toEqual([]);
    });

    it('should calculate warmup sets based on provided working load', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 3);

      expect(result).toHaveLength(3);
      expect(result[0].percentage).toBe(60);
      expect(result[1].percentage).toBe(70);
      expect(result[2].percentage).toBe(80);
    });

    it('should round loads to practical increments', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 3);

      // Check that loads are rounded to 2.5kg increments
      result.forEach((suggestion) => {
        const remainder = suggestion.load % 2.5;
        expect(remainder).toBeCloseTo(0, 1);
      });
    });

    it('should use default working load when null is provided', () => {
      const result = service.calculateWarmupSets(null, 2);

      expect(result).toHaveLength(2);
      expect(result[0].load).toBeGreaterThan(0);
    });

    it('should use default working load when undefined is provided', () => {
      const result = service.calculateWarmupSets(undefined, 2);

      expect(result).toHaveLength(2);
      expect(result[0].load).toBeGreaterThan(0);
    });

    it('should calculate correct percentages for 100kg working load', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 3);

      // Expected: 60%, 70%, 80% of 100kg
      expect(result[0].load).toBeCloseTo(60, 0);
      expect(result[1].load).toBeCloseTo(70, 0);
      expect(result[2].load).toBeCloseTo(80, 0);
    });

    it('should include recommended reps for each set', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 3);

      result.forEach((suggestion) => {
        expect(suggestion.reps).toBeGreaterThan(0);
        expect(Number.isInteger(suggestion.reps)).toBe(true);
      });
    });

    it('should return all available warmup sets when requesting more than configured', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 10);

      // Default config has 5 warmup sets
      expect(result).toHaveLength(5);
    });

    it('should handle single warmup set request', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 1);

      expect(result).toHaveLength(1);
      expect(result[0].percentage).toBe(80); // Should be the highest percentage
    });
  });

  describe('calculateFromHistory', () => {
    it('should use most recent load from history', () => {
      const history = [100, 95, 90]; // Most recent first
      const result = service.calculateFromHistory(history, 2);

      expect(result).toHaveLength(2);
      // Should base calculations on 100kg (most recent)
      expect(result[0].load).toBeCloseTo(70, 0);
      expect(result[1].load).toBeCloseTo(80, 0);
    });

    it('should handle empty history by using default', () => {
      const history: number[] = [];
      const result = service.calculateFromHistory(history, 2);

      expect(result).toHaveLength(2);
      expect(result[0].load).toBeGreaterThan(0);
    });

    it('should handle null history by using default', () => {
      const result = service.calculateFromHistory(
        null as unknown as number[],
        2,
      );

      expect(result).toHaveLength(2);
      expect(result[0].load).toBeGreaterThan(0);
    });

    it('should ignore older history entries', () => {
      const history = [80, 100, 120]; // Most recent is 80kg
      const result = service.calculateFromHistory(history, 1);

      // Should base on 80kg, not 120kg (80% of 80 = 64, rounded to 65)
      expect(result[0].load).toBeCloseTo(65, 0); // 80% of 80, rounded to 2.5kg increment
    });
  });

  describe('progressive loading pattern', () => {
    it('should generate progressive warmup loads', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 4);

      // Each set should be heavier than the previous
      for (let i = 1; i < result.length; i++) {
        expect(result[i].load).toBeGreaterThan(result[i - 1].load);
      }
    });

    it('should generate descending rep counts', () => {
      const workingLoad = 100;
      const result = service.calculateWarmupSets(workingLoad, 4);

      // Reps should generally decrease as weight increases
      for (let i = 1; i < result.length; i++) {
        expect(result[i].reps).toBeLessThanOrEqual(result[i - 1].reps);
      }
    });
  });

  describe('default configuration', () => {
    it('should use default load percentages', () => {
      const result = service.calculateWarmupSets(100, 5);

      // Check all 5 default percentages are used
      expect(result[0].percentage).toBe(40);
      expect(result[1].percentage).toBe(50);
      expect(result[2].percentage).toBe(60);
      expect(result[3].percentage).toBe(70);
      expect(result[4].percentage).toBe(80);
    });

    it('should use default reps per set', () => {
      const result = service.calculateWarmupSets(100, 5);

      // Check all 5 default rep counts
      expect(result[0].reps).toBe(8);
      expect(result[1].reps).toBe(6);
      expect(result[2].reps).toBe(5);
      expect(result[3].reps).toBe(3);
      expect(result[4].reps).toBe(2);
    });

    it('should use default working load when none provided', () => {
      const result = service.calculateWarmupSets(null, 2);

      // Should use 60kg default
      expect(result).toHaveLength(2);
      expect(result[0].load).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very light working loads', () => {
      const workingLoad = 10;
      const result = service.calculateWarmupSets(workingLoad, 2);

      expect(result).toHaveLength(2);
      result.forEach((suggestion) => {
        expect(suggestion.load).toBeGreaterThan(0);
      });
    });

    it('should handle very heavy working loads', () => {
      const workingLoad = 300;
      const result = service.calculateWarmupSets(workingLoad, 3);

      expect(result).toHaveLength(3);
      result.forEach((suggestion) => {
        expect(suggestion.load).toBeLessThan(workingLoad);
      });
    });

    it('should format loads to 1 decimal place', () => {
      const workingLoad = 77.5;
      const result = service.calculateWarmupSets(workingLoad, 2);

      result.forEach((suggestion) => {
        const decimalPlaces =
          suggestion.load.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('realistic workout scenarios', () => {
    it('should generate sensible warmup for bench press (80kg working)', () => {
      const workingLoad = 80;
      const result = service.calculateWarmupSets(workingLoad, 3);

      expect(result).toHaveLength(3);
      // Warmups should be 60%, 70%, 80% = ~48kg, ~56kg, ~64kg
      expect(result[0].load).toBeGreaterThan(45);
      expect(result[0].load).toBeLessThan(50);
      expect(result[2].load).toBeGreaterThan(60);
      expect(result[2].load).toBeLessThan(70);
    });

    it('should generate sensible warmup for squat (140kg working)', () => {
      const workingLoad = 140;
      const result = service.calculateWarmupSets(workingLoad, 4);

      expect(result).toHaveLength(4);
      // Last warmup should be close to 80% of 140kg = ~112kg
      expect(result[3].load).toBeGreaterThan(105);
      expect(result[3].load).toBeLessThan(115);
    });

    it('should handle progression from previous session', () => {
      // User did 100kg last time, now attempting 102.5kg
      const history = [100];
      const result = service.calculateFromHistory(history, 3);

      expect(result).toHaveLength(3);
      // Warmups based on 100kg working load
      expect(result[2].load).toBeCloseTo(80, 0);
    });
  });
});
