import { FrameworkConfig } from './core/config/types.ts';

export default {
  // Source paths - configure where your app files are located
  sources: {
    truthFile: './app/app.truth.ts',
    features: './app/features',
    templates: './app/templates',
    static: './app/static',
    extensions: './app/extensions',
    models: './app/models',
    views: './app/views',
    shared: './app/shared',
    components: './app/components'
  },

  // Output paths - where generated runtime files go
  output: {
    runtime: './runtime/generated'
  },

  // Environment
  environment: 'development'
} satisfies Pick<FrameworkConfig, 'sources' | 'output' | 'environment'>;