/**
 * PDF Field Mappings by Tax Year
 * 
 * Each tax year may have different field names in the PDF forms.
 * Add new mappings as year: mapping_object
 */

import type { FieldMapping, TaxYear } from '@/types';

// ============================================================================
// FORM 1040 MAPPINGS
// ============================================================================

const f1040_2025: FieldMapping = {
  "Line 1a": "topmostSubform[0].Page1[0].f1_47[0]",
  "Line 1b": "topmostSubform[0].Page1[0].f1_48[0]",
  "Line 1c": "topmostSubform[0].Page1[0].f1_49[0]",
  "Line 1d": "topmostSubform[0].Page1[0].f1_50[0]",
  "Line 1e": "topmostSubform[0].Page1[0].f1_51[0]",
  "Line 1f": "topmostSubform[0].Page1[0].f1_52[0]",
  "Line 1g": "topmostSubform[0].Page1[0].f1_53[0]",
  "Line 1ho": "topmostSubform[0].Page1[0].f1_54[0]",
  "Line 1h": "topmostSubform[0].Page1[0].f1_55[0]",
  "Line 1i": "topmostSubform[0].Page1[0].f1_56[0]",
  "Line 1z": "topmostSubform[0].Page1[0].f1_57[0]",
  "Line 2a": "topmostSubform[0].Page1[0].f1_58[0]",
  "Line 2b": "topmostSubform[0].Page1[0].f1_59[0]",
  "Line 3a": "topmostSubform[0].Page1[0].f1_60[0]",
  "Line 3b": "topmostSubform[0].Page1[0].f1_61[0]",
  "Line 4a": "topmostSubform[0].Page1[0].f1_62[0]",
  "Line 4b": "topmostSubform[0].Page1[0].f1_63[0]",
  "Line 5a": "topmostSubform[0].Page1[0].f1_65[0]",
  "Line 5b": "topmostSubform[0].Page1[0].f1_66[0]",
  "Line 6a": "topmostSubform[0].Page1[0].f1_68[0]",
  "Line 6b": "topmostSubform[0].Page1[0].f1_69[0]",
  "Line 7a": "topmostSubform[0].Page1[0].f1_70[0]",
  "Line 7b": "topmostSubform[0].Page1[0].f1_71[0]",
  "Line 8": "topmostSubform[0].Page1[0].f1_72[0]",
  "Line 9": "topmostSubform[0].Page1[0].f1_73[0]",
  "Line 10": "topmostSubform[0].Page1[0].f1_74[0]",
  "Line 11a": "topmostSubform[0].Page1[0].f1_75[0]",
  "Line 11b": "topmostSubform[0].Page2[0].f2_01[0]",
  "Line 12e": "topmostSubform[0].Page2[0].f2_02[0]",
  "Line 13a": "topmostSubform[0].Page2[0].f2_03[0]",
  "Line 13b": "topmostSubform[0].Page2[0].f2_04[0]",
  "Line 14": "topmostSubform[0].Page2[0].f2_05[0]",
  "Line 15": "topmostSubform[0].Page2[0].f2_06[0]",
  "Line 16": "topmostSubform[0].Page2[0].f2_08[0]",
  "Line 17": "topmostSubform[0].Page2[0].f2_09[0]",
  "Line 18": "topmostSubform[0].Page2[0].f2_10[0]",
  "Line 19": "topmostSubform[0].Page2[0].f2_11[0]",
  "Line 20": "topmostSubform[0].Page2[0].f2_12[0]",
  "Line 21": "topmostSubform[0].Page2[0].f2_13[0]",
  "Line 22": "topmostSubform[0].Page2[0].f2_14[0]",
  "Line 23": "topmostSubform[0].Page2[0].f2_15[0]",
  "Line 24": "topmostSubform[0].Page2[0].f2_16[0]",
  "Line 25a": "topmostSubform[0].Page2[0].f2_17[0]",
  "Line 25b": "topmostSubform[0].Page2[0].f2_18[0]",
  "Line 25c": "topmostSubform[0].Page2[0].f2_19[0]",
  "Line 25d": "topmostSubform[0].Page2[0].f2_20[0]",
  "Line 26": "topmostSubform[0].Page2[0].f2_21[0]",
  "Line 27a": "topmostSubform[0].Page2[0].f2_23[0]",
  "Line 28": "topmostSubform[0].Page2[0].f2_24[0]",
  "Line 29": "topmostSubform[0].Page2[0].f2_25[0]",
  "Line 30": "topmostSubform[0].Page2[0].f2_26[0]",
  "Line 31": "topmostSubform[0].Page2[0].f2_27[0]",
  "Line 32": "topmostSubform[0].Page2[0].f2_28[0]",
  "Line 33": "topmostSubform[0].Page2[0].f2_29[0]",
  "Line 34": "topmostSubform[0].Page2[0].f2_30[0]",
  "Line 35a": "topmostSubform[0].Page2[0].f2_31[0]",
  "Line 36": "topmostSubform[0].Page2[0].f2_34[0]",
  "Line 37": "topmostSubform[0].Page2[0].f2_35[0]",
  "Line 38": "topmostSubform[0].Page2[0].f2_36[0]",
};

const f1040Mappings: Record<TaxYear, FieldMapping> = {
  2025: f1040_2025,
};

export function getF1040Mapping(year: TaxYear = 2025): FieldMapping {
  console.log('🔍 Getting F1040 mapping for year:', year);
  const mapping = f1040Mappings[year] || f1040Mappings[2025];
  console.log('🔍 Mapping for Line 1a:', mapping["Line 1a"]);
  return mapping;
}

// ============================================================================
// FORM 8949 MAPPINGS
// ============================================================================

function generateF8949Mapping(): FieldMapping {
  const mapping: FieldMapping = {};

  // Short term transactions (14 rows, 8 columns each)
  for (let i = 0; i < 14; i++) {
    for (let j = 0; j < 8; j++) {
      const fieldNum = 8 * i + j + 3;
      // Add zero-padding for numbers less than 10
      const paddedNum = fieldNum < 10 ? `0${fieldNum}` : `${fieldNum}`;
      mapping[`st_r${i}_c${j}`] = `topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row${i + 1}[0].f1_${paddedNum}[0]`;
    }
  }

  // Short term totals
  mapping[`st_total_proceed`] = `topmostSubform[0].Page1[0].f1_91[0]`;
  mapping[`st_total_cost`] = `topmostSubform[0].Page1[0].f1_92[0]`;
  mapping[`st_total_adj`] = `topmostSubform[0].Page1[0].f1_94[0]`;
  mapping[`st_total_gl`] = `topmostSubform[0].Page1[0].f1_95[0]`;

  // Long term transactions (14 rows, 8 columns each)
  for (let i = 0; i < 14; i++) {
    for (let j = 0; j < 8; j++) {
      const fieldNum = 8 * i + j + 3;
      // Add zero-padding for numbers less than 10
      const paddedNum = fieldNum < 10 ? `0${fieldNum}` : `${fieldNum}`;
      mapping[`lt_r${i}_c${j}`] = `topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row${i + 1}[0].f2_${paddedNum}[0]`;
    }
  }

  // Long term totals
  mapping[`lt_total_proceed`] = `topmostSubform[0].Page2[0].f2_91[0]`;
  mapping[`lt_total_cost`] = `topmostSubform[0].Page2[0].f2_92[0]`;
  mapping[`lt_total_adj`] = `topmostSubform[0].Page2[0].f2_94[0]`;
  mapping[`lt_total_gl`] = `topmostSubform[0].Page2[0].f2_95[0]`;

  return mapping;
}

const f8949_2025 = generateF8949Mapping();

const f8949Mappings: Record<TaxYear, FieldMapping> = {
  2025: f8949_2025
};

export function getF8949Mapping(year: TaxYear = 2025): FieldMapping {
  return f8949Mappings[year] || f8949Mappings[2025];
}