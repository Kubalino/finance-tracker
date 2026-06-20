import Navbar from './Navbar';
import ThemeToggle from './ThemeToggle';
import styles from './AppShell.module.css';

export default function AppShell({ theme, onToggleTheme, children }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>Finance Tracker</div>
        <Navbar />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>
      <main className={`${styles.main} page-enter`}>{children}</main>
    </div>
  );
}
