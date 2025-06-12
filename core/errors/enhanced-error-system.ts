// Enhanced Error System - Central coordination of all error handling improvements
import { FrameworkError } from './framework-error.ts';
import { ErrorFormatter, formatErrorForConsole } from './error-formatter.ts';
import { generateSuggestions, generateExamples, generateQuickFixes } from './suggestions.ts';
import { HelpSystem } from '../help/help-system.ts';
import { logger } from '../logging/logger.ts';
import { DevelopmentValidator } from '../validation/development-validator.ts';
import { DebugTools } from '../debug/debug-tools.ts';
import { HotReloadManager, ReloadResult } from '../hot-reload/reload-manager.ts';
import { AppDefinition } from '../types/index.ts';

export interface EnhancedErrorReport {
  error: FrameworkError;
  formatted: {
    console: string;
    web: any;
  };
  suggestions: string[];
  examples: string[];
  quickFixes: Array<{ description: string; action: string; code?: string }>;
  documentation: any;
  relatedTutorials: any[];
  debugInfo?: any;
}

export interface DevelopmentReport {
  validation: {
    isValid: boolean;
    errors: any[];
    warnings: any[];
    tips: any[];
  };
  performance: {
    issues: any[];
    suggestions: string[];
  };
  security: {
    vulnerabilities: any[];
    recommendations: string[];
  };
  debugInfo: any;
  statistics: any;
}

export class EnhancedErrorSystem {
  private hotReloadManager?: HotReloadManager;
  private debugTools?: DebugTools;
  private devValidator = new DevelopmentValidator();
  
  constructor(private truthFilePath?: string) {
    if (truthFilePath) {
      this.hotReloadManager = new HotReloadManager(truthFilePath);
    }
  }

  // Initialize the enhanced error system
  async initialize(): Promise<void> {
    if (this.hotReloadManager) {
      await this.hotReloadManager.start();
      
      // Set up hot reload listeners for better error reporting
      this.hotReloadManager.addListener({
        onReloadStart: (files) => {
          logger.info('Hot reload started', {
            component: 'EnhancedErrorSystem',
            files: files.length
          });
        },
        onReloadSuccess: (result) => {
          logger.info('Hot reload successful', {
            component: 'EnhancedErrorSystem',
            duration: result.duration,
            warningCount: result.warnings.length,
            tipCount: result.tips.length
          });
          
          // Update debug tools with new app
          if (result.app) {
            this.debugTools = new DebugTools(result.app);
          }
        },
        onReloadError: (result) => {
          logger.error('Hot reload failed', undefined, {
            component: 'EnhancedErrorSystem',
            errorCount: result.errors.length
          });
          
          // Show enhanced error information
          this.displayReloadErrors(result);
        },
        onReloadComplete: (result) => {
          logger.debug('Hot reload completed', {
            component: 'EnhancedErrorSystem',
            success: result.success,
            duration: result.duration
          });
        }
      });
    }

    logger.info('Enhanced error system initialized', {
      component: 'EnhancedErrorSystem',
      hotReload: !!this.hotReloadManager
    });
  }

  // Process and enhance any framework error
  processError(error: FrameworkError): EnhancedErrorReport {
    // Generate all enhancement data
    const suggestions = generateSuggestions(error);
    const examples = generateExamples(error);
    const quickFixes = generateQuickFixes(error);
    const help = HelpSystem.getErrorHelp(error);
    const relatedTutorials = HelpSystem.getTutorialsForError(error.code);

    // Format for different outputs
    const formatted = {
      console: formatErrorForConsole(error),
      web: ErrorFormatter.formatForWeb(error)
    };

    const report: EnhancedErrorReport = {
      error,
      formatted,
      suggestions,
      examples,
      quickFixes,
      documentation: help.documentation,
      relatedTutorials,
      debugInfo: this.isDevelopment() ? {
        context: error.context,
        stack: error.stack,
        timestamp: error.timestamp,
        requestId: error.requestId
      } : undefined
    };

    // Log the error with enhanced context
    this.logEnhancedError(error, report);

    return report;
  }

  // Generate comprehensive development report
  generateDevelopmentReport(app: AppDefinition): DevelopmentReport {
    const debugTools = new DebugTools(app);
    const debugInfo = debugTools.generateDebugInfo();
    const devResult = this.devValidator.validate(app);

    // Analyze performance issues
    const performanceIssues = debugTools.analyzeQueryComplexity();
    const performanceSuggestions = [
      ...performanceIssues.map(issue => issue.suggestions).flat(),
      ...debugTools.generateSuggestions()
        .filter(s => s.type === 'optimization')
        .map(s => s.message)
    ];

    // Security analysis
    const securityIssues = debugTools.generateSuggestions()
      .filter(s => s.type === 'fix' && s.priority === 'high');
    
    const securityRecommendations = [
      'Review permission expressions for all entities',
      'Ensure sensitive fields are protected',
      'Implement rate limiting for API endpoints',
      'Use HTTPS in production',
      'Validate all user inputs'
    ];

    return {
      validation: {
        isValid: debugInfo.validation.isValid,
        errors: [], // Would be populated from validation
        warnings: [], // Would be populated from validation
        tips: devResult.developmentTips
      },
      performance: {
        issues: performanceIssues,
        suggestions: performanceSuggestions.slice(0, 10)
      },
      security: {
        vulnerabilities: securityIssues,
        recommendations: securityRecommendations
      },
      debugInfo,
      statistics: debugInfo.statistics
    };
  }

  // Display errors from hot reload failures
  private displayReloadErrors(result: ReloadResult): void {
    console.log('\n🚨 Hot Reload Failed');
    console.log('═'.repeat(50));

    for (const error of result.errors) {
      const report = this.processError(error);
      console.log(report.formatted.console);
      
      // Show quick fixes if available
      if (report.quickFixes.length > 0) {
        console.log('\n🔧 Quick Fixes:');
        for (const fix of report.quickFixes) {
          console.log(`• ${fix.description}`);
          if (fix.code) {
            console.log(`  ${fix.code}`);
          }
        }
      }
    }

    // Show overall recovery guidance
    this.showRecoveryGuidance(result.errors);
  }

  private showRecoveryGuidance(errors: FrameworkError[]): void {
    console.log('\n💡 Recovery Guidance:');
    console.log('─'.repeat(30));

    // Group errors by category
    const errorsByCategory = new Map<string, FrameworkError[]>();
    for (const error of errors) {
      const category = this.getErrorCategory(error.code);
      if (!errorsByCategory.has(category)) {
        errorsByCategory.set(category, []);
      }
      errorsByCategory.get(category)!.push(error);
    }

    // Provide category-specific guidance
    for (const [category, categoryErrors] of errorsByCategory) {
      console.log(`\n${category} Issues (${categoryErrors.length}):`);
      
      switch (category) {
        case 'Validation':
          console.log('• Check truth file syntax and structure');
          console.log('• Run: deno check app/app.truth.ts');
          console.log('• Use: GET /api/_debug/validate for details');
          break;
        case 'System':
          console.log('• Check file permissions and paths');
          console.log('• Verify imports and exports');
          console.log('• Review recent configuration changes');
          break;
        default:
          console.log(`• Review ${category.toLowerCase()} configuration`);
          console.log('• Check the documentation for this error type');
      }
    }

    console.log('\n📚 Resources:');
    console.log('• Documentation: https://docs.solidcore3.dev');
    console.log('• Debug API: GET /api/_debug');
    console.log('• Help System: Use HelpSystem.searchHelp("your issue")');
    console.log('');
  }

  private logEnhancedError(error: FrameworkError, report: EnhancedErrorReport): void {
    const logContext = {
      component: 'EnhancedErrorSystem',
      errorCode: error.code,
      hasQuickFixes: report.quickFixes.length > 0,
      hasExamples: report.examples.length > 0,
      hasDocumentation: !!report.documentation,
      suggestionCount: report.suggestions.length
    };

    if (error.context?.filePath) {
      logContext.filePath = error.context.filePath;
    }

    if (error.context?.lineNumber) {
      logContext.lineNumber = error.context.lineNumber;
    }

    logger.error(error.message, error, logContext);

    // Log additional helpful information in development
    if (this.isDevelopment()) {
      if (report.quickFixes.length > 0) {
        logger.info(`Available quick fixes for ${error.code}`, {
          component: 'EnhancedErrorSystem',
          quickFixes: report.quickFixes.map(f => f.description)
        });
      }

      if (report.relatedTutorials.length > 0) {
        logger.info(`Related tutorials for ${error.code}`, {
          component: 'EnhancedErrorSystem',
          tutorials: report.relatedTutorials.map(t => t.title)
        });
      }
    }
  }

  private getErrorCategory(code: string): string {
    const codeNumber = parseInt(code.substring(1));
    
    if (codeNumber >= 1000 && codeNumber < 2000) return 'Validation';
    if (codeNumber >= 2000 && codeNumber < 3000) return 'Database';
    if (codeNumber >= 3000 && codeNumber < 4000) return 'API';
    if (codeNumber >= 4000 && codeNumber < 5000) return 'System';
    if (codeNumber >= 5000 && codeNumber < 6000) return 'Extension';
    if (codeNumber >= 6000 && codeNumber < 7000) return 'Workflow';
    
    return 'Unknown';
  }

  private isDevelopment(): boolean {
    return Deno.env.get('DENO_ENV') === 'development' || 
           Deno.env.get('NODE_ENV') === 'development' || 
           !Deno.env.get('DENO_ENV');
  }

  // Cleanup resources
  async shutdown(): Promise<void> {
    if (this.hotReloadManager) {
      await this.hotReloadManager.stop();
    }

    logger.info('Enhanced error system shutdown', {
      component: 'EnhancedErrorSystem'
    });
  }

  // Public API for getting error help
  static getErrorHelp(error: FrameworkError): EnhancedErrorReport {
    const system = new EnhancedErrorSystem();
    return system.processError(error);
  }

  // Public API for searching help
  static searchHelp(query: string) {
    return HelpSystem.searchHelp(query);
  }

  // Public API for getting contextual help
  static getContextualHelp(context: any) {
    return HelpSystem.getContextualHelp(context);
  }
}