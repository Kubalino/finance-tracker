import { useState } from 'react';
import Card from '../shared/Card';
import styles from './ColumnMapper.module.css';

const FIELDS = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'description', label: 'Description' },
];

export default function ColumnMapper({ headers, sampleRow, onConfirm, onCancel }) {
  const [mapping, setMapping] = useState({ date: '', amount: '', description: '' });
  const [signedAmounts, setSignedAmounts] = useState(true);

  const isComplete = FIELDS.every((f) => mapping[f.key] !== '');

  return (
    <Card>
      <h3 className={styles.title}>Map CSV Columns</h3>
      <p className={styles.hint}>Tell us which column holds each field. A sample row is shown for reference.</p>

      <div className={styles.fields}>
        {FIELDS.map((f) => (
          <label key={f.key} className={styles.field}>
            <span className={styles.label}>{f.label}</span>
            <select
              className={styles.select}
              value={mapping[f.key]}
              onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
            >
              <option value="">Select column</option>
              {headers.map((h, i) => (
                <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
              ))}
            </select>
            {mapping[f.key] !== '' && sampleRow && (
              <span className={styles.sample}>e.g. "{sampleRow[Number(mapping[f.key])]}"</span>
            )}
          </label>
        ))}
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={signedAmounts}
          onChange={(e) => setSignedAmounts(e.target.checked)}
        />
        <span>
          Amounts are signed (negative = money out, positive = money in)
          <span className={styles.checkboxHint}>
            Uncheck if every amount in this file is positive — e.g. an export where a separate column
            already says the category/type instead of the sign of the number.
          </span>
        </span>
      </label>

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button
          className={styles.submitBtn}
          disabled={!isComplete}
          onClick={() => onConfirm({
            date: Number(mapping.date),
            amount: Number(mapping.amount),
            description: Number(mapping.description),
            signedAmounts,
          })}
        >
          Continue
        </button>
      </div>
    </Card>
  );
}
