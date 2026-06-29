import { useState } from 'react';
import ImportUpload from '../components/import/ImportUpload';
import ColumnMapper from '../components/import/ColumnMapper';
import PreviewTable from '../components/import/PreviewTable';
import KeywordManager from '../components/import/KeywordManager';
import Card from '../components/shared/Card';
import PageLoader from '../components/shared/PageLoader';
import NeedsSyncState from '../components/shared/NeedsSyncState';
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

// Income is always positive. When the source file uses signed amounts (the
// normal bank-statement convention), Expenses/Savings default to the natural
// sign of the transaction (debit -> positive cost, credit -> negative, e.g. a
// reimbursement against that same category). When the file has no sign
// information at all (e.g. an old all-positive export), there's nothing to
// derive — every amount stays positive until the user manually marks a row
// as a reimbursement by editing it negative themselves.
function deriveAmount(rawSignedAmount, type, signedAmounts) {
  if (!signedAmounts) return Math.abs(rawSignedAmount);
  return type === 'Income' ? Math.abs(rawSignedAmount) : -rawSignedAmount;
}

export default function Import() {
  const { addTransactionsBulk, existingHashes } = useTransactions();
  const { byType } = useCategories();
  const { refresh: refreshKeywords } = useKeywords();
  const { settings, loading: settingsLoading } = useSettings();
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
        const rawSignedAmount = parseAmount(rawAmount);
        const absAmount = Math.abs(rawSignedAmount);
        const signGuessedType = mapping.signedAmounts ? (rawSignedAmount < 0 ? 'Expenses' : 'Income') : 'Expenses';

        if (!date || Number.isNaN(rawSignedAmount)) {
          return { rawDate, rawAmount, description, date, rawSignedAmount, amount: rawSignedAmount, type: signGuessedType, category: '', hash: null, status: 'invalid', signedAmounts: mapping.signedAmounts };
        }

        const hash = await generateHash(date, absAmount, description);
        if (knownHashes.has(hash)) {
          return { rawDate, rawAmount, description, date, rawSignedAmount, amount: deriveAmount(rawSignedAmount, signGuessedType, mapping.signedAmounts), type: signGuessedType, category: '', hash, status: 'duplicate', signedAmounts: mapping.signedAmounts };
        }

        const keywordMatch = matchKeyword(description, freshKeywords);
        const type = keywordMatch?.type || signGuessedType;
        const category = keywordMatch?.category || '';
        const amount = deriveAmount(rawSignedAmount, type, mapping.signedAmounts);
        return { rawDate, rawAmount, description, date, rawSignedAmount, amount, type, category, hash, status: category ? 'new' : 'unmatched', signedAmounts: mapping.signedAmounts };
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

      // Re-derive the amount's sign for the new type, unless the user has
      // already hand-edited this row's amount directly.
      if (changes.type && !row.amountEdited) {
        updated.amount = deriveAmount(row.rawSignedAmount, changes.type, row.signedAmounts);
      }

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
      amount: r.type === 'Income' ? Math.abs(r.amount) : r.amount,
      details: r.description,
      importBatch,
    }));

    await addTransactionsBulk(rows);
    showToast(`Imported ${rows.length} transaction${rows.length === 1 ? '' : 's'}`);
    setStep('upload');
    setCsvData(null);
    setPreviewRows([]);
  };

  if (settingsLoading) return <PageLoader />;
  if (!settings) return <NeedsSyncState />;

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
