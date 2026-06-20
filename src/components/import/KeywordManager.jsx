import { useMemo, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import Card from '../shared/Card';
import { useKeywords } from '../../hooks/useKeywords';
import { useCategories } from '../../hooks/useCategories';
import { matchKeyword } from '../../utils/keywordEngine';
import styles from './KeywordManager.module.css';

const TYPES = ['Income', 'Expenses', 'Savings'];

export default function KeywordManager() {
  const { keywords, addKeyword, deleteKeyword } = useKeywords();
  const { byType } = useCategories();

  const [newKeyword, setNewKeyword] = useState('');
  const [newType, setNewType] = useState('Expenses');
  const [newCategory, setNewCategory] = useState('');
  const [testText, setTestText] = useState('');

  const categoryOptions = byType(newType);
  const testMatch = useMemo(
    () => (testText.trim() ? matchKeyword(testText, keywords) : null),
    [testText, keywords]
  );

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newCategory) return;
    addKeyword(newKeyword, newType, newCategory);
    setNewKeyword('');
    setNewCategory('');
  };

  return (
    <div className={styles.wrap}>
      <Card>
        <h3 className={styles.title}>Add Keyword Mapping</h3>
        <form onSubmit={handleAdd} className={styles.addForm}>
          <input
            type="text"
            placeholder="e.g. netflix"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className={styles.input}
          />
          <select
            value={newType}
            onChange={(e) => { setNewType(e.target.value); setNewCategory(''); }}
            className={styles.input}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className={styles.input}
          >
            <option value="">Select category</option>
            {categoryOptions.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button type="submit" className={styles.addBtn}>Add</button>
        </form>
      </Card>

      <Card>
        <h3 className={styles.title}>Test a Description</h3>
        <div className={styles.testRow}>
          <Search size={16} className={styles.testIcon} />
          <input
            type="text"
            placeholder="Paste a transaction description…"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className={styles.testInput}
          />
        </div>
        {testText.trim() && (
          <div className={styles.testResult}>
            {testMatch
              ? <span className={styles.matchFound}>Matches → {testMatch.type} / {testMatch.category}</span>
              : <span className={styles.noMatch}>No keyword match</span>}
          </div>
        )}
      </Card>

      <Card>
        <h3 className={styles.title}>Keyword Mappings ({keywords.length})</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Type</th>
              <th>Category</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {keywords.length === 0 && (
              <tr><td colSpan={4} className={styles.empty}>No keyword mappings yet</td></tr>
            )}
            {keywords.map((kw) => (
              <tr key={kw.id}>
                <td className="monospace">{kw.keyword}</td>
                <td><span className={`${styles.badge} ${styles[kw.type.toLowerCase()]}`}>{kw.type}</span></td>
                <td>{kw.category}</td>
                <td>
                  <button className={styles.deleteBtn} onClick={() => deleteKeyword(kw.id)} aria-label="Delete keyword">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
