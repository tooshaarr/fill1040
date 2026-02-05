/**
 * Core type definitions for the tax form filler application
 */

/** Represents a value that can be filled in a PDF field */
export type FieldValue = string | number;

/** Map of PDF field names to their values */
export type VariableMap = Record<string, FieldValue>;

/** Map of Excel variable names to PDF field names */
export type FieldMapping = Record<string, string>;

/** Multiple PDF forms data keyed by form identifier */
export type FormsData = Record<string, VariableMap>;

/** Tax year for form mappings */
export type TaxYear = number;

/** Form validation result */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

/** Parsed Excel data structure */
export interface ExcelRow {
  [header: string]: any;
}

/** Form configuration */
export interface FormConfig {
  /** Unique identifier for the form (e.g., 'f8949', 'f1040') */
  formId: string;
  
  /** Human-readable name */
  displayName: string;
  
  /** Excel sheet name to match */
  sheetName: string;
  
  /** Path to the PDF template */
  pdfTemplatePath: string;
  
  /** Default tax year if not specified */
  defaultYear: TaxYear;
  
  /** Whether this form requires special parsing */
  requiresCustomParser: boolean;
}

/** Result from parsing a single sheet */
export interface ParseResult {
  /** Unique form identifier(s) - can generate multiple forms from one sheet */
  formIds: string[];
  
  /** Data for each generated form */
  formsData: FormsData;
  
  /** Any validation issues found during parsing */
  validation: ValidationResult;
}

/** Excel parsing options */
export interface ParseOptions {
  /** Tax year for form mappings */
  year: TaxYear;
  
  /** Whether to validate data during parsing */
  validate: boolean;
  
  /** Whether to skip empty rows */
  skipEmptyRows: boolean;
}

/** PDF filling result */
export interface FillResult {
  /** Form identifier */
  formId: string;
  
  /** Success status */
  success: boolean;
  
  /** Filled PDF bytes */
  pdfBytes?: Uint8Array;
  
  /** Error message if failed */
  error?: string;
  
  /** Fields that were successfully filled */
  filledFields: string[];
  
  /** Fields that failed to fill */
  failedFields: string[];
}