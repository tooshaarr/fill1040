/**
 * Main Entry Point
 * UI event handlers and initialization
 */

import { app } from './TaxFormFillerApp';
import './style.css';

// DOM Elements
const xlsxInput = document.getElementById('xlsxFile') as HTMLInputElement;
const downloadBtn = document.getElementById('downloadPdf') as HTMLButtonElement;
const yearSelect = document.getElementById('taxYear') as HTMLSelectElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const formsInfo = document.getElementById('formsInfo') as HTMLDivElement;

// Initialize
function init() {
  console.log('🚀 Tax Form Filler App initialized');
  console.log('📋 Supported forms:', app.getSupportedForms());
  
  updateStatus('Ready. Please upload an Excel file.');
  downloadBtn.disabled = true;
}

// Update status message
function updateStatus(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status status-${type}`;
  }
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Update forms info display
function updateFormsInfo(formsData: Record<string, any>) {
  if (!formsInfo) return;

  const formCount = Object.keys(formsData).length;
  if (formCount === 0) {
    formsInfo.textContent = '';
    return;
  }

  const formsList = Object.keys(formsData).map(id => `• ${id}`).join('\n');
  formsInfo.textContent = `Forms ready to generate (${formCount}):\n${formsList}`;
}

// Handle Excel file upload
xlsxInput?.addEventListener('change', async () => {
  const file = xlsxInput.files?.[0];
  if (!file) return;

  updateStatus('Processing Excel file...', 'info');
  downloadBtn.disabled = true;

  try {
    // Get selected tax year
    const year = yearSelect ? parseInt(yearSelect.value) : 2024;
    app.setTaxYear(year);

    // Process the file
    await app.processExcelFile(file, {
      taxYear: year,
      validate: true,
      verbose: true
    });

    const formsData = app.getFormsData();
    const formCount = Object.keys(formsData).length;

    if (formCount === 0) {
      updateStatus('No forms could be generated from this file. Please check the sheet names.', 'warning');
      downloadBtn.disabled = true;
    } else {
      updateStatus(`✅ Successfully processed file. ${formCount} form(s) ready.`, 'success');
      updateFormsInfo(formsData);
      downloadBtn.disabled = false;
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    updateStatus(`❌ Error processing file: ${message}`, 'error');
    downloadBtn.disabled = true;
    console.error('Error processing Excel file:', error);
  }
});

// Handle download button click
downloadBtn?.addEventListener('click', async () => {
  updateStatus('Generating PDFs...', 'info');
  downloadBtn.disabled = true;

  try {
    await app.downloadFilledPdfs({ verbose: true });
    updateStatus('✅ PDFs downloaded successfully!', 'success');
    
    // Re-enable button after a delay
    setTimeout(() => {
      downloadBtn.disabled = false;
      updateStatus('Ready for next operation.', 'info');
    }, 2000);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    updateStatus(`❌ Error generating PDFs: ${message}`, 'error');
    downloadBtn.disabled = false;
    console.error('Error generating PDFs:', error);
  }
});

// Handle tax year change
yearSelect?.addEventListener('change', () => {
  const year = parseInt(yearSelect.value);
  app.setTaxYear(year);
  console.log(`📅 Tax year changed to ${year}`);
  
  // Clear current data when year changes
  app.clear();
  updateStatus(`Tax year set to ${year}. Please upload an Excel file.`, 'info');
  updateFormsInfo({});
  downloadBtn.disabled = true;
  
  // Clear file input
  if (xlsxInput) {
    xlsxInput.value = '';
  }
});

// Initialize app
init();

// Debug utilities (available in console)
(window as any).debugApp = {
  app,
  printFields: (formId: string) => app.debugPrintFields(formId),
  generateFieldMap: (formId: string) => app.debugGenerateFieldMap(formId),
  getSupportedForms: () => app.getSupportedForms(),
  getFormsData: () => app.getFormsData()
};

console.log('💡 Debug utilities available: window.debugApp');