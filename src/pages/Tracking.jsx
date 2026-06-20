import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import TrackingFilters from '../components/tracking/TrackingFilters';
import TransactionTable from '../components/tracking/TransactionTable';
import AddEntryForm from '../components/tracking/AddEntryForm';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { trackingBalance } from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import styles from './Tracking.module.css';

export default function Tracking() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { byType } = useCategories();
  const { settings } = useSettings();
  const showToast = useToast();

  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [editingTx, setEditingTx] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);

  const handleTypeChange = (value) => {
    setType(value);
    setCategory('');
  };

  const categoryOptions = useMemo(
    () => (type ? byType(type).map((c) => c.name) : []),
    [type, byType]
  );

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (type && tx.type !== type) return false;
      if (category && tx.category !== category) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      return true;
    });
  }, [transactions, type, category, dateFrom, dateTo]);

  const currentYear = new Date().getFullYear();
  const entriesThisYear = transactions.filter((tx) => tx.date.slice(0, 4) === String(currentYear)).length;
  const lastEntryDate = transactions.length
    ? transactions.reduce((latest, tx) => (tx.date > latest ? tx.date : latest), transactions[0].date)
    : null;
  const balance = trackingBalance(transactions);

  const closeForm = () => {
    setShowAddForm(false);
    setEditingTx(null);
  };

  const handleCreate = async (values) => {
    await addTransaction(values, settings);
    showToast('Transaction added');
    closeForm();
  };

  const handleUpdate = async (values) => {
    await updateTransaction(editingTx.id, values);
    showToast('Transaction updated');
    closeForm();
  };

  const handleConfirmDelete = async () => {
    await deleteTransaction(deletingTx.id);
    showToast('Transaction deleted');
    setDeletingTx(null);
  };

  if (loading || !settings) return null;

  return (
    <div>
      <div className={styles.kpiGrid}>
        <KPICard label="Last Entry" value={lastEntryDate ? formatDate(lastEntryDate) : '—'} />
        <KPICard label="Total Entries" value={`${transactions.length} (${entriesThisYear} this year)`} />
        <KPICard label="Running Balance" value={formatCurrency(balance)} />
      </div>

      <div className={styles.toolbar}>
        <TrackingFilters
          type={type}
          onTypeChange={handleTypeChange}
          category={category}
          onCategoryChange={setCategory}
          categoryOptions={categoryOptions}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />
        <button className={styles.addBtn} onClick={() => setShowAddForm(true)}>
          <Plus size={16} /> Add Entry
        </button>
      </div>

      <TransactionTable
        transactions={filtered}
        onRowClick={setEditingTx}
        onDelete={setDeletingTx}
      />

      {(showAddForm || editingTx) && (
        <Modal title={editingTx ? 'Edit Transaction' : 'Add Transaction'} onClose={closeForm}>
          <AddEntryForm
            initial={editingTx}
            settings={settings}
            onSubmit={editingTx ? handleUpdate : handleCreate}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {deletingTx && (
        <ConfirmDialog
          title="Delete Transaction"
          message={`Delete "${deletingTx.category}" (${formatCurrency(deletingTx.amount)} on ${formatDate(deletingTx.date)})? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTx(null)}
        />
      )}
    </div>
  );
}
