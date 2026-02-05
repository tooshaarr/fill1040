/**
 * Abstract base class for form parsers
 * Each tax form type should extend this class
 */

import type { ExcelRow, ParseResult, ParseOptions, ValidationResult, FormsData } from '@/types';

export abstract class FormParser {
  /**
   * Determines if this parser can handle the given sheet
   */
  abstract canParse(sheetName: string): boolean;

  /**
   * Parse Excel rows into PDF field data
   */
  abstract parse(rows: ExcelRow[], options: ParseOptions): ParseResult;

  /**
   * Validate the parsed data
   */
  protected abstract validate(data: FormsData): ValidationResult;

  /**
   * Get the form configuration
   */
  abstract getFormConfig(): { formId: string; displayName: string };

  /**
   * Helper method to create a successful parse result
   */
  protected createParseResult(
    formIds: string[],
    formsData: FormsData,
    validation: ValidationResult
  ): ParseResult {
    return {
      formIds,
      formsData,
      validation
    };
  }

  /**
   * Helper method to create validation result
   */
  protected createValidationResult(
    isValid: boolean,
    errors: Array<{ field: string; message: string }> = [],
    warnings: Array<{ field: string; message: string }> = []
  ): ValidationResult {
    return {
      isValid,
      errors: errors.map(e => ({ ...e, severity: 'error' as const })),
      warnings: warnings.map(w => ({ ...w, severity: 'warning' as const }))
    };
  }

  /**
   * Helper to check if a value is empty
   */
  protected isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * Helper to safely convert dates
   */
  protected excelDateToString(serial: number): string {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const mm = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date_info.getUTCDate()).padStart(2, '0');
    const yyyy = date_info.getUTCFullYear();

    return `${mm}/${dd}/${yyyy}`;
  }

  /**
   * Helper to format date from various inputs
   */
  protected formatDate(value: any): string {
    if (typeof value === 'number') {
      return this.excelDateToString(value);
    }
    if (value instanceof Date) {
      const mm = String(value.getMonth() + 1).padStart(2, '0');
      const dd = String(value.getDate()).padStart(2, '0');
      const yyyy = value.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    return String(value);
  }

  /**
   * Helper to safely parse numbers
   */
  protected parseNumber(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value).replace(/[$,]/g, ''));
    return isNaN(parsed) ? defaultValue : parsed;
  }
}