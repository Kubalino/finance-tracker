import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Pencil, Plus, Check, X } from 'lucide-react';
import Card from '../shared/Card';
import ConfirmDialog from '../shared/ConfirmDialog';
import { db } from '../../db';
import styles from './CategoryEditor.module.css';

const TYPES = ['Income', 'Expenses', 'Savings'];

export default function CategoryEditor({ byType, addCategory, renameCategory, reorderCategory, deleteCategory }) {
  const [activeType, setActiveType] = useState('Income');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [inUseError, setInUseError] = useState(null);

  const list = byType(activeType);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addCategory(activeType, newName.trim());
    setNewName('');
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditValue(cat.name);
  };

  const saveEdit = () => {
    if (editValue.trim()) renameCategory(editingId, editValue.trim());
    setEditingId(null);
  };

  const move = (cat, direction) => {
    const idx = list.findIndex((c) => c.id === cat.id);
    const swapWith = list[idx + direction];
    if (!swapWith) return;
    reorderCategory(cat.id, swapWith.order);
    reorderCategory(swapWith.id, cat.order);
  };

  const requestDelete = async (cat) => {
    const count = await db.transactions.where('category').equals(cat.name).count();
    if (count > 0) {
      setInUseError({ cat, count });
      return;
    }
    setPendingDelete(cat);
  };

  const confirmDelete = () => {
    deleteCategory(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <Card>
      <h3 className={styles.title}>Categories</h3>

      <div className={styles.typeTabs}>
        {TYPES.map((t) => (
          <button
            key={t}
            className={`${styles.typeTab} ${activeType === t ? styles.activeTab : ''}`}
            onClick={() => setActiveType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <ul className={styles.list}>
        {list.map((cat, i) => (
          <li key={cat.id} className={styles.item}>
            {editingId === cat.id ? (
              <>
                <input
                  className={styles.editInput}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                />
                <button className={styles.iconBtn} onClick={saveEdit} aria-label="Save"><Check size={14} /></button>
                <button className={styles.iconBtn} onClick={() => setEditingId(null)} aria-label="Cancel"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className={styles.name}>{cat.name}</span>
                <button className={styles.iconBtn} disabled={i === 0} onClick={() => move(cat, -1)} aria-label="Move up"><ChevronUp size={14} /></button>
                <button className={styles.iconBtn} disabled={i === list.length - 1} onClick={() => move(cat, 1)} aria-label="Move down"><ChevronDown size={14} /></button>
                <button className={styles.iconBtn} onClick={() => startEdit(cat)} aria-label="Rename"><Pencil size={14} /></button>
                <button className={styles.iconBtn} onClick={() => requestDelete(cat)} aria-label="Delete"><Trash2 size={14} /></button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <input
          className={styles.addInput}
          placeholder={`New ${activeType.toLowerCase()} category`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className={styles.addBtn}><Plus size={14} /> Add</button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete Category"
          message={`Delete "${pendingDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {inUseError && (
        <ConfirmDialog
          title="Category In Use"
          message={`"${inUseError.cat.name}" is used by ${inUseError.count} transaction${inUseError.count === 1 ? '' : 's'}. Reassign or delete those transactions first before removing this category.`}
          confirmLabel="OK"
          onConfirm={() => setInUseError(null)}
          onCancel={() => setInUseError(null)}
        />
      )}
    </Card>
  );
}
