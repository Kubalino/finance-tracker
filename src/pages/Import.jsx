import { useState } from 'react';
import ImportUpload from '../components/import/ImportUpload';
import ColumnMapper from '../components/import/ColumnMapper';
import PreviewTable from '../components/import/PreviewTable';
import KeywordManager from '../components/import/KeywordManager';
import Card from '../components/shared/Card';
import { parseCSVFile, parseAmount, parseDate } from '../utils/csvParser';
import { generateHash } from '../utils/hash';
import { matchKeyword } from '../utils/keywordEngine';
import { computeEffectiveDate } from '../utils/dateUtils';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useKeywords } from '../hooks/useKeywords';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import styles from './Import.module.css';

function uuid() {
  return crypto.randomUUID();
}

export default function Import() {
  const { addTransactionsBulk, existingHashes } = useTransactions();
  const { byType } = useCategories();
  const { refresh: refreshKeywords } = useKeywords();
  const { settings } = useSettings();
  const showToast = useToast();

  const [tab, setTab] = useState('import');
  const [step, setStep] = useState('upload');
  const [csvData, setCsvData] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = async (file) => {
    try {
      const data = await parseCSVFile(file);
      setCsvData(data);
      setStep('mapping');
    } catch {
      showToast('Could not parse that file. Please check it is a valid CSV.', 'error');
    }
  };

  const handleMappingConfirm = async (mapping) => {
    setProcessing(true);
    const [knownHashes, freshKeywords] = await Promise.all([existingHashes(), refreshKeywords()]);

    const candidates = await Promise.all(
      csvData.rows.map(async (row) => {
        const rawDate = row[mapping.date] ?? '';
        const rawAmount = row[mapping.amount] ?? '';
        const description = (row[mapping.description] ?? '').trim();

        const date = parseDate(rawDate);
        const signedAmount = parseAmount(rawAmount);
        const amount = Math.abs(signedAmount);
        const signGuessedType = signedAmount < 0 ? 'Expenses' : 'Income';

        if (!date || Number.isNaN(signedAmount)) {
          return { rawDate, rawAmount, description, date, amount: signedAmount, type: signGuessedType, category: '', hash: null, status: 'invalid' };
        }

        const hash = await generateHash(date, amount, description);
        if (knownHashes.has(hash)) {
          return { rawDate, rawAmount, description, date, amount, type: signGuessedType, category: '', hash, status: 'duplicate' };
        }

        const keywordMatch = matchKeyword(description, freshKeywords);
        const type = keywordMatch?.type || signGuessedType;
        const category = keywordMatch?.category || '';
        return { rawDate, rawAmount, description, date, amount, type, category, hash, status: category ? 'new' : 'unmatched' };
      })
    );

    setPreviewRows(candidates);
    setProcessing(false);
    setStep('preview');
  };

  const handleRowChange = (index, changes) => {
    setPreviewRows((rows) => rows.map((row, i) => {
      if (i !== index) return row;
      const updated = { ...row, ...changes };
      if (updated.status !== 'duplicate' && updated.status !== 'invalid') {
        updated.status = updated.category ? 'new' : 'unmatched';
      }
      return updated;
    }));
  };

  const handleConfirmImport = async () => {
    const importBatch = uuid();
    const importable = previewRows.filter((r) => r.status === 'new');

    if (importable.length === 0) {
      showToast('No rows ready to import — assign a category to at least one row.', 'error');
      return;
    }

    const rows = importable.map((r) => ({
      hash: r.hash,
      date: r.date,
      effectiveDate: computeEffectiveDate(r.date, r.type, settings),
      type: r.type,
      category: r.category,
      amount: r.amount,
      details: r.description,
      importBatch,
    }));

    await addTransactionsBulk(rows);
    showToast(`Imported ${rows.length} transaction${rows.length === 1 ? '' : 's'}`);
    setStep('upload');
    setCsvData(null);
    setPreviewRows([]);
  };

  if (!settings) return null;

  return (
    <div className={styles.page}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'import' ? styles.activeTab : ''}`} onClick={() => setTab('import')}>
          Import CSV
        </button>
        <button className={`${styles.tab} ${tab === 'keywords' ? styles.activeTab : ''}`} onClick={() => setTab('keywords')}>
          Keyword Manager
        </button>
      </div>

      {tab === 'keywords' && <KeywordManager />}

      {tab === 'import' && (
        <>
          {step === 'upload' && <ImportUpload onFileSelected={handleFileSelected} />}

          {step === 'mapping' && csvData && (
            processing ? (
              <Card><p>Processing rows…</p></Card>
            ) : (
              <ColumnMapper
                headers={csvData.headers}
                sampleRow={csvData.rows[0]}
                onConfirm={handleMappingConfirm}
                onCancel={() => { setStep('upload'); setCsvData(null); }}
              />
            )
          )}

          {step === 'preview' && (
            <>
              <PreviewTable rows={previewRows} onRowChange={handleRowChange} byType={byType} />
              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={() => { setStep('upload'); setCsvData(null); setPreviewRows([]); }}>
                  Cancel
                </button>
                <button className={styles.confirmBtn} onClick={handleConfirmImport}>
                  Confirm Import
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
