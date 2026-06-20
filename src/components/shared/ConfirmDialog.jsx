import Modal from './Modal';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
        <button onClick={onConfirm} className={styles.dangerBtn}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
