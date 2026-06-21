import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.wrap}>
          <AlertTriangle size={32} className={styles.icon} />
          <h2 className={styles.title}>Something went wrong</h2>
          <p className={styles.message}>{this.state.error.message || 'An unexpected error occurred.'}</p>
          <button className={styles.button} onClick={() => window.location.reload()}>Reload App</button>
        </div>
      );
    }

    return this.props.children;
  }
}
