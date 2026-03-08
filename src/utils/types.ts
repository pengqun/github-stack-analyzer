export type TechCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'database'
  | 'devops'
  | 'testing'
  | 'styling'
  | 'build-tool'
  | 'infrastructure'
  | 'other';

export interface DependencyPattern {
  source: string;
  packages: string[];
}

export interface ContentPattern {
  file: string;
  pattern: string;
}

export interface TechFingerprint {
  id: string;
  name: string;
  category: TechCategory;
  website?: string;
  patterns: {
    files?: string[];
    directories?: string[];
    dependencies?: DependencyPattern[];
    contents?: ContentPattern[];
  };
  confidence: {
    fileMatch: number;
    depMatch: number;
    contentMatch: number;
  };
}

export interface Signal {
  type: 'file' | 'dependency' | 'content' | 'directory';
  source: string;
  detail: string;
}

export interface DetectedTech {
  tech: TechFingerprint;
  score: number;
  signals: Signal[];
}

export interface ParsedDependencies {
  source: string;
  packages: string[];
}

export interface AnalysisResult {
  repoUrl: string;
  analyzedAt: number;
  technologies: DetectedTech[];
  fileTree: string[];
}

export interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
}

export type AnalysisErrorCode =
  | 'PRIVATE_REPO'
  | 'EMPTY_REPO'
  | 'RATE_LIMITED'
  | 'REPO_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AnalysisError {
  code: AnalysisErrorCode;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}

export type MessageType =
  | { type: 'ANALYZE_REPO'; repoUrl: string; fileTree: string[] }
  | { type: 'GET_CACHED_RESULT'; repoUrl: string }
  | { type: 'ANALYSIS_RESULT'; result: AnalysisResult }
  | { type: 'ANALYSIS_ERROR'; error: AnalysisError };
