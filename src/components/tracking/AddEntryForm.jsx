import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { computeEffectiveDate } from '../../utils/dateUtils';
import styles from './AddEntryForm.module.css';

const TYPES = ['Income', 'Expenses', 'Savings'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddEntryForm({ initial, settings, onSubmit, onCancel }) {
  const { byType } = useCategories();
  const [form, setForm] = useState(() => ({
    date: initial?.date || todayISO(),
    type: initial?.type || 'Expenses',
    category: initial?.category || '',
    amount: initial?.amount?.toString() || '',
    details: initial?.details || '',
  }));
  const [errors, setErrors] = useState({});

  const categoryOptions = byType(form.type);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value, ...(field === 'type' ? { category: '' } : {}) }));
  };

  const validate = () => {
    const errs = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.type) errs.type = 'Type is required';
    if (!form.category) errs.category = 'Category is required';
    const amountNum = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      errs.amount = 'Amount must be a positive number';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const amount = Number(form.amount);
    onSubmit({
      date: form.date,
      type: form.type,
      category: form.category,
      amount,
      details: form.details.trim(),
      effectiveDate: computeEffectiveDate(form.date, form.type, settings),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Date</span>
        <input
          type="date"
          value={form.date}
          onChange={(e) => update('date', e.target.value)}
          className={styles.input}
        />
        {errors.date && <span className={styles.error}>{errors.date}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Type</span>
        <select value={form.type} onChange={(e) => update('type', e.target.value)} className={styles.input}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Category</span>
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className={styles.input}>
          <option value="">Select a category</option>
          {categoryOptions.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {errors.category && <span className={styles.error}>{errors.category}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Amount (€)</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => update('amount', e.target.value)}
          className={styles.input}
        />
        {errors.amount && <span className={styles.error}>{errors.amount}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Details</span>
        <input
          type="text"
          value={form.details}
          onChange={(e) => update('details', e.target.value)}
          className={styles.input}
          placeholder="Optional description"
        />
      </label>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
        <button type="submit" className={styles.submitBtn}>{initial ? 'Save Changes' : 'Add Entry'}</button>
      </div>
    </form>
  );
}
