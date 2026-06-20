import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import Card from '../shared/Card';
import Modal from '../shared/Modal';
import { db } from '../../db';
import { useToast } from '../../hooks/useToast';
import styles from './DataManagement.module.css';

const CONFIRM_PHRASE = 'DELETE ALL DATA';

export default function DataManagement({ onDataChanged }) {
  const showToast = useToast();
  const fileInputRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPhrase, setClearPhrase] = useState('');

  const handleExport = async () => {
    const [transactions, categories, keywords, settings] = await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
      db.keywords.toArray(),
      db.settings.toArray(),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      keywords,
      settings,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported');
  };

  const handleImportFile = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
        throw new Error('Invalid backup file');
      }

      await db.transaction('rw', db.transactions, db.categories, db.keywords, db.settings, async () => {
        await db.transactions.clear();
        await db.categories.clear();
        await db.keywords.clear();
        await db.settings.clear();
        await db.transactions.bulkAdd(data.transactions);
        await db.categories.bulkAdd(data.categories);
        await db.keywords.bulkAdd(data.keywords || []);
        await db.settings.bulkAdd(data.settings || []);
      });

      showToast('Backup imported successfully');
      onDataChanged();
    } catch {
      showToast('Could not import that file. Please check it is a valid backup.', 'error');
    }
  };

  const handleClearAll = async () => {
    await db.transaction('rw', db.transactions, db.categories, db.keywords, db.settings, async () => {
      await db.transactions.clear();
      await db.categories.clear();
      await db.keywords.clear();
      await db.settings.clear();
    });
    setShowClearConfirm(false);
    setClearPhrase('');
    showToast('All data cleared');
    onDataChanged();
  };

  return (
    <Card>
      <h3 className={styles.title}>Data Management</h3>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={handleExport}>
          <Download size={15} /> Export Backup (JSON)
        </button>

        <button className={styles.actionBtn} onClick={() => fileInputRef.current.click()}>
          <Upload size={15} /> Import Backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className={styles.hiddenInput}
          onChange={(e) => { if (e.target.files[0]) handleImportFile(e.target.files[0]); e.target.value = ''; }}
        />

        <button className={styles.dangerBtn} onClick={() => setShowClearConfirm(true)}>
          <Trash2 size={15} /> Clear All Data
        </button>
      </div>

      {showClearConfirm && (
        <Modal title="Clear All Data" onClose={() => { setShowClearConfirm(false); setClearPhrase(''); }}>
          <p className={styles.warning}>
            This will permanently delete all transactions, categories, and keyword mappings from this browser.
            This cannot be undone. Type <strong>{CONFIRM_PHRASE}</strong> to confirm.
          </p>
          <input
            className={styles.phraseInput}
            value={clearPhrase}
            onChange={(e) => setClearPhrase(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoFocus
          />
          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowClearConfirm(false); setClearPhrase(''); }}>
              Cancel
            </button>
            <button
              className={styles.confirmDangerBtn}
              disabled={clearPhrase !== CONFIRM_PHRASE}
              onClick={handleClearAll}
            >
              Permanently Delete
            </button>
          </div>
        </Modal>
      )}
    </Card>
  );
}
