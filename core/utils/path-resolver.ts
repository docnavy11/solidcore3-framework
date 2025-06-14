import { SourcePathsConfig, OutputPathsConfig } from '../config/types.ts';
import { join, resolve } from '@std/path';

export class PathResolver {
  constructor(
    private sources: SourcePathsConfig,
    private output: OutputPathsConfig
  ) {}

  // Truth file access
  getTruthFile(): string {
    return resolve(this.sources.truthFile);
  }

  // Source path helpers
  getSourcePath(type: keyof SourcePathsConfig, relativePath: string = ''): string {
    if (type === 'truthFile') {
      return this.getTruthFile();
    }
    
    const basePath = this.sources[type];
    return relativePath ? resolve(join(basePath, relativePath)) : resolve(basePath);
  }

  // Specific source directory helpers
  getFeaturesPath(relativePath: string = ''): string {
    return this.getSourcePath('features', relativePath);
  }

  getTemplatesPath(relativePath: string = ''): string {
    return this.getSourcePath('templates', relativePath);
  }

  getStaticPath(relativePath: string = ''): string {
    return this.getSourcePath('static', relativePath);
  }

  getExtensionsPath(relativePath: string = ''): string {
    return this.getSourcePath('extensions', relativePath);
  }

  getModelsPath(relativePath: string = ''): string {
    return this.getSourcePath('models', relativePath);
  }

  getViewsPath(relativePath: string = ''): string {
    return this.getSourcePath('views', relativePath);
  }

  getSharedPath(relativePath: string = ''): string {
    return this.getSourcePath('shared', relativePath);
  }

  getComponentsPath(relativePath: string = ''): string {
    return this.getSourcePath('components', relativePath);
  }

  // Output path helpers
  getOutputPath(relativePath: string = ''): string {
    const basePath = this.output.runtime;
    return relativePath ? resolve(join(basePath, relativePath)) : resolve(basePath);
  }

  getRuntimePath(relativePath: string = ''): string {
    return this.getOutputPath(relativePath);
  }

  // Utility methods
  getAllSourcePaths(): string[] {
    return [
      this.getTruthFile(),
      this.getFeaturesPath(),
      this.getTemplatesPath(),
      this.getStaticPath(),
      this.getExtensionsPath(),
      this.getModelsPath(),
      this.getViewsPath(),
      this.getSharedPath(),
      this.getComponentsPath()
    ];
  }

  getWatchablePaths(): string[] {
    // Return paths that should be watched for changes
    return [
      this.getTruthFile(),
      this.getTemplatesPath(),
      this.getExtensionsPath(),
      this.getViewsPath(),
      this.getComponentsPath(),
      this.getSharedPath()
    ];
  }

  // Helper to convert relative paths to absolute when needed
  resolveRelativeTo(basePath: string, relativePath: string): string {
    return resolve(join(basePath, relativePath));
  }

  // Get directory from a source type (used by generators)
  getSourceDirectory(type: keyof SourcePathsConfig): string {
    if (type === 'truthFile') {
      // Return the directory containing the truth file
      const truthPath = this.getTruthFile();
      return resolve(join(truthPath, '..'));
    }
    return this.getSourcePath(type);
  }
}