/**
 * Excel Parsing Service
 * Handles reading and parsing Excel files
 */

import * as XLSX from 'xlsx';
import { parserRegistry } from '@/parsers/ParserRegistry';
import type { FormsData, ParseOptions, ExcelRow, ValidationResult } from '@/types';

export interface ExcelParseResult {
  formsData: FormsData;
  validation: ValidationResult;
  sheetsProcessed: string[];
  sheetsFailed: string[];
}

export class ExcelParserService {
  /**
   * Parse an Excel file and extract form data
   */
  async parseFile(file: File, options: Partial<ParseOptions> = {}): Promise<ExcelParseResult> {
    const defaultOptions: ParseOptions = {
      year: 2025,
      validate: true,
      skipEmptyRows: true,
      ...options
    };

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    const allFormsData: FormsData = {};
    const sheetsProcessed: string[] = [];
    const sheetsFailed: string[] = [];
    const allErrors: ValidationResult['errors'] = [];
    const allWarnings: ValidationResult['warnings'] = [];

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: ''
        });

        if (rows.length === 0) {
          console.warn(`Sheet "${sheetName}" is empty, skipping`);
          continue;
        }

        // Parse using appropriate parser
        const result = parserRegistry.parse(sheetName, rows, defaultOptions);

        // Merge results
        Object.assign(allFormsData, result.formsData);
        
        if (result.formIds.length > 0) {
          sheetsProcessed.push(sheetName);
        }

        // Collect validation results
        allErrors.push(...result.validation.errors);
        allWarnings.push(...result.validation.warnings);

        console.log(`✅ Processed sheet: ${sheetName}`, {
          formsGenerated: result.formIds.length,
          formIds: result.formIds
        });

      } catch (error) {
        sheetsFailed.push(sheetName);
        allErrors.push({
          field: sheetName,
          message: `Failed to parse sheet: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error'
        });
        console.error(`❌ Failed to process sheet "${sheetName}":`, error);
      }
    }

    return {
      formsData: allFormsData,
      validation: {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
      },
      sheetsProcessed,
      sheetsFailed
    };
  }

  /**
   * Get supported forms info
   */
  getSupportedForms() {
    return parserRegistry.getSupportedForms();
  }
}

// Singleton instance
export const excelParser = new ExcelParserService();