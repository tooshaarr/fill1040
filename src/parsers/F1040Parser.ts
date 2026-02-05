/**
 * Parser for IRS Form 1040 - U.S. Individual Income Tax Return
 * Uses standard variable-to-field mapping
 */

import { FormParser } from './FormParser';
import { getF1040Mapping } from '@/config/mappings';
import type { ExcelRow, ParseResult, ParseOptions, ValidationResult, FormsData, VariableMap } from '@/types';

export class F1040Parser extends FormParser {
  canParse(sheetName: string): boolean {
    return sheetName.toLowerCase() === 'f1040' || sheetName.toLowerCase() === '1040';
  }

  getFormConfig() {
    return {
      formId: 'f1040',
      displayName: 'Form 1040 - U.S. Individual Income Tax Return'
    };
  }

  parse(rows: ExcelRow[], options: ParseOptions): ParseResult {
    if (rows.length === 0) {
      return this.createParseResult(
        [],
        {},
        this.createValidationResult(false, [{ field: 'sheet', message: 'No data found in sheet' }])
      );
    }

    const mapping = getF1040Mapping(options.year);
    const fieldValues: VariableMap = {};

    // Try to detect if first row is header
    const firstRow = rows[0];
    console.log('🔍 First row keys:', Object.keys(firstRow));
    console.log('🔍 First row data:', firstRow);
    console.log('🔍 Looks like header?', this.looksLikeHeader(firstRow));
    console.log('🔍 Has variable/value columns?', this.hasColumns(firstRow, ['variable', 'value']));
    

    const hasHeader = this.looksLikeHeader(firstRow);
    const dataRows = hasHeader ? rows.slice(1) : rows;

    // Parse rows based on format
    if (hasHeader && this.hasColumns(firstRow, ['variable', 'value'])) {
      // Format: Variable | Value
      this.parseColumnFormat(dataRows, mapping, fieldValues, options.skipEmptyRows);
    } else {
      // Format: Two columns without headers (backward compatible)
      this.parseSimpleFormat(dataRows, mapping, fieldValues);
    }

    const formsData: FormsData = {
      f1040: fieldValues
    };

    const validation = options.validate 
      ? this.validate(formsData)
      : this.createValidationResult(true);

    return this.createParseResult(['f1040'], formsData, validation);
  }

  private looksLikeHeader(row: ExcelRow): boolean {
    const keys = Object.keys(row);
    
    // If the keys are "Variable" and "Value", then the data rows are already using those as keys
    // This means XLSX already consumed the header row, so current rows are data
    const hasProperKeys = keys.some(k => 
        k.toLowerCase() === 'variable' || k.toLowerCase() === 'value'
    );
    
    if (hasProperKeys) {
        return false; // The header was already consumed by XLSX, these are data rows
    }
    
    // Check if first value looks like a header name
    const firstValue = Object.values(row)[0];
    if (typeof firstValue !== 'string') return false;
    
    const normalized = firstValue.toLowerCase().trim();
    return ['variable', 'field', 'line', 'item'].some(h => normalized.includes(h));
  }

  private hasColumns(row: ExcelRow, expectedColumns: string[]): boolean {
    const keys = Object.keys(row).map(k => k.toLowerCase().trim());
    return expectedColumns.every(col => 
      keys.some(k => k.includes(col) || col.includes(k))
    );
  }

  private parseColumnFormat(
    rows: ExcelRow[],
    mapping: Record<string, string>,
    fieldValues: VariableMap,
    skipEmptyRows: boolean = true
  ): void {
    // Find the variable and value columns
    const firstRow = rows[0];
    if (!firstRow) return;

    const headers = Object.keys(firstRow);
    const variableCol = headers.find(h => 
      h.toLowerCase().includes('variable') || 
      h.toLowerCase().includes('field') ||
      h.toLowerCase().includes('line')
    );
    const valueCol = headers.find(h => 
      h.toLowerCase().includes('value') || 
      h.toLowerCase().includes('amount')
    );

    if (!variableCol || !valueCol) {
      console.warn('Could not detect variable and value columns');
      return;
    }

    console.log('🔍 Variable column:', variableCol);
    console.log('🔍 Value column:', valueCol);

    // Parse each row
    for (const row of rows) {
      const variable = row[variableCol];
      const value = row[valueCol];

      if (this.isEmpty(variable)) {
        if (skipEmptyRows) continue;
        break;
      }

      const mappedKey = mapping[String(variable)];
      if (mappedKey && !this.isEmpty(value)) {
        fieldValues[mappedKey] = value;
      }
    }
  }

  private parseSimpleFormat(
    rows: ExcelRow[],
    mapping: Record<string, string>,
    fieldValues: VariableMap
  ): void {
    const headers = Object.keys(rows[0] || {});
    if (headers.length < 2) {
      console.warn('Not enough columns for simple format');
      return;
    }

    const variableCol = headers[0];
    const valueCol = headers[1];

    for (const row of rows) {
      const variable = row[variableCol];
      const value = row[valueCol];

      if (this.isEmpty(variable)) break;

      const mappedKey = mapping[String(variable)];
      if (mappedKey && !this.isEmpty(value)) {
        fieldValues[mappedKey] = value;
      }
    }
  }

  protected validate(data: FormsData): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    const formData = data.f1040;
    
    if (!formData || Object.keys(formData).length === 0) {
      errors.push({ field: 'f1040', message: 'No data found for Form 1040' });
      return this.createValidationResult(false, errors, warnings);
    }

    // Check for required fields (basic validation)
    const requiredFields = [
      'topmostSubform[0].Page1[0].f1_32[0]', // Line 1a - wages
    ];

    for (const field of requiredFields) {
      if (this.isEmpty(formData[field])) {
        warnings.push({ 
          field: field, 
          message: `Required field is empty` 
        });
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}