import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTree, Upload, Settings } from 'lucide-react';
import styles from './Navbar.module.css';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tracking', label: 'Tracking', icon: ListTree },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          <Icon size={18} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
