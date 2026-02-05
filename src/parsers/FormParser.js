/**
 * Abstract base class for form parsers
 * Each tax form type should extend this class
 */
export class FormParser {
    /**
     * Helper method to create a successful parse result
     */
    createParseResult(formIds, formsData, validation) {
        return {
            formIds,
            formsData,
            validation
        };
    }
    /**
     * Helper method to create validation result
     */
    createValidationResult(isValid, errors = [], warnings = []) {
        return {
            isValid,
            errors: errors.map(e => ({ ...e, severity: 'error' })),
            warnings: warnings.map(w => ({ ...w, severity: 'warning' }))
        };
    }
    /**
     * Helper to check if a value is empty
     */
    isEmpty(value) {
        return value === null || value === undefined || value === '';
    }
    /**
     * Helper to safely convert dates
     */
    excelDateToString(serial) {
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
    formatDate(value) {
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
    parseNumber(value, defaultValue = 0) {
        if (typeof value === 'number')
            return value;
        const parsed = parseFloat(String(value).replace(/[$,]/g, ''));
        return isNaN(parsed) ? defaultValue : parsed;
    }
}
