/**
 * Parser Registry
 * Central registry for all form parsers
 */

import { FormParser } from './FormParser';
import { F8949Parser } from './F8949Parser';
import { F1040Parser } from './F1040Parser';
import type { ExcelRow, ParseResult, ParseOptions } from '@/types';

export class ParserRegistry {
  private parsers: FormParser[] = [];

  constructor() {
    // Register all available parsers
    this.register(new F8949Parser());
    this.register(new F1040Parser());
    
    // Add more parsers here as they're created
    // this.register(new FScheduleCParser());
    // this.register(new F1099Parser());
  }

  /**
   * Register a new parser
   */
  register(parser: FormParser): void {
    this.parsers.push(parser);
  }

  /**
   * Find and use the appropriate parser for a sheet
   */
  parse(sheetName: string, rows: ExcelRow[], options: ParseOptions): ParseResult {
    const parser = this.findParser(sheetName);
    
    if (!parser) {
      return {
        formIds: [],
        formsData: {},
        validation: {
          isValid: false,
          errors: [{
            field: 'sheet',
            message: `No parser found for sheet: ${sheetName}`,
            severity: 'error'
          }],
          warnings: []
        }
      };
    }

    return parser.parse(rows, options);
  }

  /**
   * Find the appropriate parser for a sheet name
   */
  private findParser(sheetName: string): FormParser | undefined {
    return this.parsers.find(p => p.canParse(sheetName));
  }

  /**
   * Get all registered parsers
   */
  getAll(): FormParser[] {
    return [...this.parsers];
  }

  /**
   * Get information about all supported forms
   */
  getSupportedForms(): Array<{ formId: string; displayName: string }> {
    return this.parsers.map(p => p.getFormConfig());
  }
}

// Singleton instance
export const parserRegistry = new ParserRegistry();