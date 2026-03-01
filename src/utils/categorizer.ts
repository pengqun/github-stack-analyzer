import type { DetectedTech, TechCategory } from './types';
import { CATEGORY_ORDER } from './constants';

export interface CategorizedResults {
  category: TechCategory;
  technologies: DetectedTech[];
}

/**
 * Group detected technologies by category and sort by confidence within each group.
 * Categories are returned in the predefined display order.
 */
export function categorizeResults(technologies: DetectedTech[]): CategorizedResults[] {
  const grouped = new Map<TechCategory, DetectedTech[]>();

  for (const tech of technologies) {
    const category = tech.tech.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(tech);
  }

  // Sort each group by score descending
  for (const techs of grouped.values()) {
    techs.sort((a, b) => b.score - a.score);
  }

  // Return in predefined category order, only including categories with results
  const results: CategorizedResults[] = [];
  for (const category of CATEGORY_ORDER) {
    const techs = grouped.get(category);
    if (techs && techs.length > 0) {
      results.push({ category, technologies: techs });
    }
  }

  return results;
}

/**
 * Get a human-readable confidence label for a score.
 */
export function confidenceLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Trace';
}
