/**
 * Main Application Controller
 * Orchestrates the entire workflow
 */
import { excelParser } from '@/services/ExcelParserService';
import { pdfService } from '@/services/PdfService';
export class TaxFormFillerApp {
    constructor() {
        this.formsData = {};
        this.currentYear = 2025;
    }
    /**
     * Set the tax year
     */
    setTaxYear(year) {
        this.currentYear = year;
    }
    /**
     * Process an uploaded Excel file
     */
    async processExcelFile(file, options = {}) {
        const { taxYear = this.currentYear, validate = true, verbose = false } = options;
        console.log(`📊 Processing Excel file: ${file.name}`);
        console.log(`📅 Tax Year: ${taxYear}`);
        const result = await excelParser.parseFile(file, {
            year: taxYear,
            validate,
            skipEmptyRows: true
        });
        // Store the forms data
        this.formsData = result.formsData;
        // Log results
        console.log(`✅ Processed ${result.sheetsProcessed.length} sheets`);
        console.log(`📝 Generated ${Object.keys(this.formsData).length} forms`);
        if (result.sheetsFailed.length > 0) {
            console.warn(`⚠️ Failed to process ${result.sheetsFailed.length} sheets:`, result.sheetsFailed);
        }
        // Log validation results
        if (result.validation.errors.length > 0) {
            console.error('❌ Validation Errors:');
            result.validation.errors.forEach(err => {
                console.error(`  - ${err.field}: ${err.message}`);
            });
        }
        if (result.validation.warnings.length > 0 && verbose) {
            console.warn('⚠️ Validation Warnings:');
            result.validation.warnings.forEach(warn => {
                console.warn(`  - ${warn.field}: ${warn.message}`);
            });
        }
        // Summary
        console.log('\n📋 Summary:');
        console.log(`  Forms generated: ${Object.keys(this.formsData).join(', ')}`);
    }
    /**
     * Download filled PDFs as a zip file
     */
    async downloadFilledPdfs(options = {}) {
        if (Object.keys(this.formsData).length === 0) {
            throw new Error('No forms data available. Please upload an Excel file first.');
        }
        const { verbose = false } = options;
        console.log('📦 Generating filled PDFs...');
        const zipBlob = await pdfService.fillMultiplePdfs(this.formsData, {
            formsBasePath: '/forms',
            verbose
        });
        // Trigger download
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax_forms_${this.currentYear}_filled.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ Download started');
    }
    /**
     * Get current forms data
     */
    getFormsData() {
        return { ...this.formsData };
    }
    /**
     * Clear all data
     */
    clear() {
        this.formsData = {};
        console.log('🗑️ Cleared all forms data');
    }
    /**
     * Get supported forms
     */
    getSupportedForms() {
        return excelParser.getSupportedForms();
    }
    /**
     * Utility: Print fields from a specific form PDF
     */
    async debugPrintFields(formId) {
        await pdfService.printPdfFields(`/forms/${formId}.pdf`);
    }
    /**
     * Utility: Generate a PDF with unique values for field mapping
     */
    async debugGenerateFieldMap(formId) {
        const pdfBytes = await pdfService.fillWithUniqueValues(`/forms/${formId}.pdf`);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formId}_field_map.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`✅ Generated field map for ${formId}`);
    }
}
// Create singleton instance
export const app = new TaxFormFillerApp();
