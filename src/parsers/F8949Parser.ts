/**
 * Parser for IRS Form 8949 - Sales and Other Dispositions of Capital Assets
 * Handles both short-term and long-term capital gains/losses
 */

import { FormParser } from './FormParser';
import { getF8949Mapping } from '@/config/mappings';
import type { ExcelRow, ParseResult, ParseOptions, ValidationResult, FormsData, VariableMap } from '@/types';

interface CapitalTransaction {
  quantity: number;
  name: string;
  purchaseDate: string;
  sellDate: string;
  purchasePrice: number;
  sellPrice: number;
  code: string;
  adjustment: number;
  isShortTerm: boolean;
}

export class F8949Parser extends FormParser {
  private static readonly MAX_ROWS_PER_FORM = 14;
  private static readonly ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  // Expected column headers (case-insensitive matching)
  private static readonly EXPECTED_HEADERS = {
    quantity: ['quantity', 'qty', 'shares', 'units'],
    name: ['name', 'description', 'security', 'asset'],
    purchaseDate: ['purchase date', 'acquired', 'buy date', 'date acquired'],
    sellDate: ['sell date', 'sold', 'sale date', 'date sold'],
    purchasePrice: ['purchase price', 'cost basis', 'basis', 'cost'],
    sellPrice: ['sell price', 'proceeds', 'sale price', 'sales proceeds'],
    code: ['code', 'code(s)', 'codes'],
    adjustment: ['adjustment', 'amount of adjustment', 'adj']
  };

  canParse(sheetName: string): boolean {
    return sheetName.toLowerCase() === 'f8949' || sheetName.toLowerCase() === '8949';
  }

  getFormConfig() {
    return {
      formId: 'f8949',
      displayName: 'Form 8949 - Sales and Dispositions of Capital Assets'
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

    // Parse transactions from Excel
    const transactions = this.parseTransactions(rows);

    if (transactions.length === 0) {
      return this.createParseResult(
        [],
        {},
        this.createValidationResult(false, [{ field: 'data', message: 'No valid transactions found' }])
      );
    }

    // Separate into short-term and long-term
    const shortTerm = transactions.filter(t => t.isShortTerm);
    const longTerm = transactions.filter(t => !t.isShortTerm);

    // Get mapping for the specified year
    const mapping = getF8949Mapping(options.year);

    // Chunk into separate forms (14 rows per form)
    const shortTermForms = this.chunkTransactions(shortTerm, 'st', mapping);
    const longTermForms = this.chunkTransactions(longTerm, 'lt', mapping);

    // Combine into final forms
    const formsData = this.combineForms(shortTermForms, longTermForms);
    const formIds = Object.keys(formsData);

    // Validate if requested
    const validation = options.validate 
      ? this.validate(formsData)
      : this.createValidationResult(true);

    return this.createParseResult(formIds, formsData, validation);
  }

  private parseTransactions(rows: ExcelRow[]): CapitalTransaction[] {
    const transactions: CapitalTransaction[] = [];

    // Try to detect column mapping from first row
    const firstRow = rows[0];
    const columnMap = this.detectColumns(firstRow);

    if (!columnMap) {
      console.warn('Could not detect column structure for F8949');
      return [];
    }

    // Parse each transaction row
    for (const row of rows) {
      if (this.isEmpty(row[columnMap.quantity])) continue;

      try {
        const purchaseDate = this.parseDate(row[columnMap.purchaseDate]);
        const sellDate = this.parseDate(row[columnMap.sellDate]);
        const isShortTerm = this.isShortTermGain(purchaseDate, sellDate);

        transactions.push({
          quantity: this.parseNumber(row[columnMap.quantity]),
          name: String(row[columnMap.name] || ''),
          purchaseDate: this.formatDate(row[columnMap.purchaseDate]),
          sellDate: this.formatDate(row[columnMap.sellDate]),
          purchasePrice: this.parseNumber(row[columnMap.purchasePrice]),
          sellPrice: this.parseNumber(row[columnMap.sellPrice]),
          code: String(row[columnMap.code] || ''),
          adjustment: this.parseNumber(row[columnMap.adjustment] || 0), 
          isShortTerm
        });
      } catch (error) {
        console.warn('Failed to parse transaction row:', row, error);
      }
    }

    return transactions;
  }

  private detectColumns(firstRow: ExcelRow): Record<string, string> | null {
    const columnMap: Record<string, string> = {};

    // Required columns
    const requiredColumns = ['quantity', 'name', 'purchaseDate', 'sellDate', 'purchasePrice', 'sellPrice'];
    
    // Optional columns
    const optionalColumns = ['code', 'adjustment'];

    // Try to match each required column
    for (const key of requiredColumns) {
      const possibleHeaders = F8949Parser.EXPECTED_HEADERS[key as keyof typeof F8949Parser.EXPECTED_HEADERS];
      const found = Object.keys(firstRow).find(col => {
        const normalized = col.toLowerCase().trim();
        return possibleHeaders.some(ph => normalized.includes(ph) || ph.includes(normalized));
      });

      if (found) {
        columnMap[key] = found;
      } else {
        console.warn(`Could not find required column for: ${key}`);
        return null;
      }
    }

    // Try to match optional columns (don't fail if not found)
    for (const key of optionalColumns) {
      const possibleHeaders = F8949Parser.EXPECTED_HEADERS[key as keyof typeof F8949Parser.EXPECTED_HEADERS];
      const found = Object.keys(firstRow).find(col => {
        const normalized = col.toLowerCase().trim();
        return possibleHeaders.some(ph => normalized.includes(ph) || ph.includes(normalized));
      });

      if (found) {
        columnMap[key] = found;
      }
      // If not found, we'll use default values
    }

    return columnMap;
  }

  private parseDate(value: any): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
      // Excel date serial number
      const utc_days = Math.floor(value - 25569);
      const utc_value = utc_days * 86400;
      return new Date(utc_value * 1000);
    }
    return new Date(value);
  }

  private isShortTermGain(purchaseDate: Date, sellDate: Date): boolean {
    const diffMs = sellDate.getTime() - purchaseDate.getTime();
    return diffMs < F8949Parser.ONE_YEAR_MS;
  }

  private chunkTransactions(
    transactions: CapitalTransaction[],
    typePrefix: 'st' | 'lt',
    mapping: Record<string, string>
  ): VariableMap[] {
    const chunks: VariableMap[] = [];

    for (let i = 0; i < transactions.length; i += F8949Parser.MAX_ROWS_PER_FORM) {
      const chunk = transactions.slice(i, i + F8949Parser.MAX_ROWS_PER_FORM);
      const formData: VariableMap = {};

      let totalProceeds = 0;
      let totalCost = 0;
      let totalGainLoss = 0;
      let totalAdjustment = 0;

      chunk.forEach((transaction, idx) => {
        const gainLoss = transaction.sellPrice - transaction.purchasePrice - transaction.adjustment;


        // Column 0: Description (quantity + name)
        const col0Key = mapping[`${typePrefix}_r${idx}_c0`];
        const col0Value = `${transaction.quantity} sh. ${transaction.name}`;
        formData[col0Key] = col0Value;
        
        // Column 1: Date acquired
        formData[mapping[`${typePrefix}_r${idx}_c1`]] = transaction.purchaseDate;
        
        // Column 2: Date sold
        formData[mapping[`${typePrefix}_r${idx}_c2`]] = transaction.sellDate;
        
        // Column 3: Proceeds (sales price)
        formData[mapping[`${typePrefix}_r${idx}_c3`]] = transaction.sellPrice;
        
        // Column 4: Cost basis
        formData[mapping[`${typePrefix}_r${idx}_c4`]] = transaction.purchasePrice;
        // Column 5: Code
        if (transaction.code) {
          formData[mapping[`${typePrefix}_r${idx}_c5`]] = transaction.code;
        }

        // Column 6: Adjustment (negative for ESPP discount, etc.)
        formData[mapping[`${typePrefix}_r${idx}_c6`]] = transaction.adjustment;

        
        // Column 7: Gain or loss
        formData[mapping[`${typePrefix}_r${idx}_c7`]] = gainLoss;

        totalProceeds += transaction.sellPrice;
        totalCost += transaction.purchasePrice;
        totalGainLoss += gainLoss;
        totalAdjustment += transaction.adjustment;
      });

      // Add totals
      formData[mapping[`${typePrefix}_total_proceed`]] = totalProceeds;
      formData[mapping[`${typePrefix}_total_cost`]] = totalCost;
      formData[mapping[`${typePrefix}_total_gl`]] = totalGainLoss;
      formData[mapping[`${typePrefix}_total_adj`]] = totalAdjustment;

      chunks.push(formData);
    }

    return chunks;
  }

  private combineForms(shortTermForms: VariableMap[], longTermForms: VariableMap[]): FormsData {
    const totalForms = Math.max(shortTermForms.length, longTermForms.length);
    const result: FormsData = {};

    for (let i = 0; i < totalForms; i++) {
      result[`f8949_${i + 1}`] = {
        ...(shortTermForms[i] || {}),
        ...(longTermForms[i] || {})
      };
    }

    return result;
  }

  protected validate(data: FormsData): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    // Basic validation
    if (Object.keys(data).length === 0) {
      errors.push({ field: 'forms', message: 'No forms generated' });
    }

    // Check for reasonable values in each form
    for (const [formId, formData] of Object.entries(data)) {
      // Check if we have data
      if (Object.keys(formData).length === 0) {
        warnings.push({ field: formId, message: 'Form has no data' });
      }

      // Check for negative proceeds (unusual)
      for (const [key, value] of Object.entries(formData)) {
        if (key.includes('_c3') && typeof value === 'number' && value < 0) {
          warnings.push({ 
            field: `${formId}.${key}`, 
            message: 'Negative proceeds amount detected' 
          });
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}