import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import Card from '../shared/Card';
import styles from './ImportUpload.module.css';

export default function ImportUpload({ onFileSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <Card>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud size={32} className={styles.icon} />
        <p className={styles.text}>Drag & drop your bank CSV here, or click to browse</p>
        <p className={styles.hint}>Parsed entirely in your browser — the file never leaves your machine</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className={styles.hiddenInput}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </Card>
  );
}
