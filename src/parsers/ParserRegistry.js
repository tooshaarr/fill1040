/**
 * Parser Registry
 * Central registry for all form parsers
 */
import { F8949Parser } from './F8949Parser';
import { F1040Parser } from './F1040Parser';
export class ParserRegistry {
    constructor() {
        this.parsers = [];
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
    register(parser) {
        this.parsers.push(parser);
    }
    /**
     * Find and use the appropriate parser for a sheet
     */
    parse(sheetName, rows, options) {
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
    findParser(sheetName) {
        return this.parsers.find(p => p.canParse(sheetName));
    }
    /**
     * Get all registered parsers
     */
    getAll() {
        return [...this.parsers];
    }
    /**
     * Get information about all supported forms
     */
    getSupportedForms() {
        return this.parsers.map(p => p.getFormConfig());
    }
}
// Singleton instance
export const parserRegistry = new ParserRegistry();
