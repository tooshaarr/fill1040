/**
 * PDF Service
 * Handles filling PDF forms with data
 */
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
export class PdfService {
    constructor() {
        this.defaultBasePath = '/forms';
    }
    /**
     * Fill a single PDF with data
     */
    async fillPdf(pdfPath, fieldValues, options = {}) {
        const { verbose = false } = options;
        const formId = this.extractFormId(pdfPath);
        try {
            // Fetch the PDF template
            const pdfBytes = await this.fetchPdf(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            const filledFields = [];
            const failedFields = [];
            // Fill each field
            for (const field of fields) {
                const fieldName = field.getName();
                const value = fieldValues[fieldName];
                if (fieldName === 'topmostSubform[0].Page1[0].f1_47[0]') {
                    console.log('🔍 DEBUG Line 1a:', { fieldName, value, hasValue: value !== undefined });
                }
                if (value !== undefined && value !== null && value !== '') {
                    try {
                        if ('setText' in field && typeof field.setText === 'function') {
                            field.setText(String(value));
                            filledFields.push(fieldName);
                            if (verbose) {
                                console.log(`✅ Filled "${fieldName}" = ${value}`);
                            }
                        }
                    }
                    catch (error) {
                        failedFields.push(fieldName);
                        console.warn(`⚠️ Could not fill field "${fieldName}":`, error);
                    }
                }
            }
            const filledPdfBytes = await pdfDoc.save();
            if (verbose) {
                console.log(`📄 ${formId}: Filled ${filledFields.length}/${fields.length} fields`);
            }
            return {
                formId,
                success: true,
                pdfBytes: filledPdfBytes,
                filledFields,
                failedFields
            };
        }
        catch (error) {
            return {
                formId,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                filledFields: [],
                failedFields: []
            };
        }
    }
    /**
     * Fill multiple PDFs and create a zip file
     */
    async fillMultiplePdfs(formsData, options = {}) {
        const { formsBasePath = this.defaultBasePath } = options;
        const zip = new JSZip();
        for (const [formId, fieldValues] of Object.entries(formsData)) {
            try {
                // Determine PDF path
                const pdfPath = this.getPdfPath(formId, formsBasePath);
                // Fill the PDF
                const result = await this.fillPdf(pdfPath, fieldValues, options);
                if (result.success && result.pdfBytes) {
                    // Add to zip
                    const fileName = `${formId}_filled.pdf`;
                    zip.file(fileName, result.pdfBytes);
                    console.log(`✅ Added ${fileName} to zip`);
                }
                else {
                    console.error(`❌ Failed to fill ${formId}: ${result.error}`);
                }
            }
            catch (error) {
                console.error(`❌ Error processing ${formId}:`, error);
            }
        }
        // Generate zip file
        return await zip.generateAsync({ type: 'blob' });
    }
    /**
     * Fetch a PDF template
     */
    async fetchPdf(pdfPath) {
        const response = await fetch(pdfPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF at ${pdfPath}: ${response.statusText}`);
        }
        return await response.arrayBuffer();
    }
    /**
     * Get the PDF path for a form ID
     */
    getPdfPath(formId, basePath) {
        // Handle multiple instances of same form (e.g., f8949_1, f8949_2)
        const baseFormId = formId.split('_')[0];
        return `${basePath}/${baseFormId}.pdf`;
    }
    /**
     * Extract form ID from PDF path
     */
    extractFormId(pdfPath) {
        const fileName = pdfPath.split('/').pop() || pdfPath;
        return fileName.replace('.pdf', '');
    }
    /**
     * Utility: Print all fields in a PDF (for debugging)
     */
    async printPdfFields(pdfPath) {
        try {
            const pdfBytes = await this.fetchPdf(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            console.log(`📋 PDF "${pdfPath}" has ${fields.length} fields:`);
            fields.forEach((field, idx) => {
                console.log(`${idx + 1}. ${field.getName()}`);
            });
        }
        catch (error) {
            console.error(`❌ Failed to read PDF fields: ${error}`);
        }
    }
    /**
     * Utility: Fill PDF with unique values for field identification
     */
    async fillWithUniqueValues(pdfPath) {
        const pdfBytes = await this.fetchPdf(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        fields.forEach((field, idx) => {
            try {
                if ('setText' in field && typeof field.setText === 'function') {
                    field.setText(`Field #${idx + 1}`);
                }
            }
            catch (error) {
                console.warn(`Could not fill field: ${field.getName()}`);
            }
        });
        return await pdfDoc.save();
    }
}
// Singleton instance
export const pdfService = new PdfService();
