import { describe, it, expect } from 'vitest';
import { categorizeResults, confidenceLabel } from '../src/utils/categorizer';
import type { DetectedTech, TechFingerprint } from '../src/utils/types';

function makeTech(id: string, category: string, score: number): DetectedTech {
  return {
    tech: {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      category: category as TechFingerprint['category'],
      patterns: {},
      confidence: { fileMatch: 10, depMatch: 10, contentMatch: 3 },
    },
    score,
    signals: [{ type: 'file', source: 'test.ts', detail: 'Test signal' }],
  };
}

describe('categorizeResults', () => {
  it('groups technologies by category', () => {
    const techs = [
      makeTech('react', 'framework', 80),
      makeTech('typescript', 'language', 90),
      makeTech('jest', 'testing', 70),
      makeTech('vue', 'framework', 60),
    ];

    const result = categorizeResults(techs);

    const categories = result.map((r) => r.category);
    expect(categories).toContain('language');
    expect(categories).toContain('framework');
    expect(categories).toContain('testing');
  });

  it('sorts technologies by score within each category', () => {
    const techs = [
      makeTech('react', 'framework', 60),
      makeTech('nextjs', 'framework', 90),
      makeTech('vue', 'framework', 40),
    ];

    const result = categorizeResults(techs);
    const frameworks = result.find((r) => r.category === 'framework')!;

    expect(frameworks.technologies[0].tech.id).toBe('nextjs');
    expect(frameworks.technologies[1].tech.id).toBe('react');
    expect(frameworks.technologies[2].tech.id).toBe('vue');
  });

  it('respects predefined category order', () => {
    const techs = [
      makeTech('jest', 'testing', 80),
      makeTech('typescript', 'language', 90),
      makeTech('react', 'framework', 85),
    ];

    const result = categorizeResults(techs);
    const categories = result.map((r) => r.category);

    expect(categories.indexOf('language')).toBeLessThan(categories.indexOf('framework'));
    expect(categories.indexOf('framework')).toBeLessThan(categories.indexOf('testing'));
  });

  it('omits categories with no technologies', () => {
    const techs = [makeTech('typescript', 'language', 90)];
    const result = categorizeResults(techs);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('language');
  });

  it('handles empty input', () => {
    expect(categorizeResults([])).toEqual([]);
  });
});

describe('confidenceLabel', () => {
  it('returns High for score >= 80', () => {
    expect(confidenceLabel(80)).toBe('High');
    expect(confidenceLabel(100)).toBe('High');
  });

  it('returns Medium for score >= 50', () => {
    expect(confidenceLabel(50)).toBe('Medium');
    expect(confidenceLabel(79)).toBe('Medium');
  });

  it('returns Low for score >= 20', () => {
    expect(confidenceLabel(20)).toBe('Low');
    expect(confidenceLabel(49)).toBe('Low');
  });

  it('returns Trace for score < 20', () => {
    expect(confidenceLabel(0)).toBe('Trace');
    expect(confidenceLabel(19)).toBe('Trace');
  });
});
