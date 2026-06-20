import Card from '../shared/Card';
import styles from './SettingsForm.module.css';

export default function SettingsForm({ settings, onUpdate }) {
  return (
    <Card>
      <h3 className={styles.title}>App Configuration</h3>

      <div className={styles.row}>
        <div>
          <div className={styles.label}>Late Income Shift</div>
          <div className={styles.hint}>Income received late in the month counts toward next month</div>
        </div>
        <button
          className={`${styles.toggle} ${settings.lateIncomeShift ? styles.toggleOn : ''}`}
          onClick={() => onUpdate({ lateIncomeShift: !settings.lateIncomeShift })}
          aria-pressed={settings.lateIncomeShift}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>

      {settings.lateIncomeShift && (
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Shift Threshold Day</div>
            <div className={styles.hint}>Income on/after this day of the month rolls to the next month</div>
          </div>
          <input
            type="number"
            min="1"
            max="31"
            value={settings.lateIncomeStartDay}
            onChange={(e) => onUpdate({ lateIncomeStartDay: Number(e.target.value) })}
            className={styles.numberInput}
          />
        </div>
      )}

      <div className={styles.row}>
        <div>
          <div className={styles.label}>Savings Rate Calculation</div>
          <div className={styles.hint}>How the dashboard computes your savings rate</div>
        </div>
        <select
          value={settings.savingsRateCalc}
          onChange={(e) => onUpdate({ savingsRateCalc: e.target.value })}
          className={styles.select}
        >
          <option value="allocated">Allocated (Savings / Income)</option>
          <option value="passive">Passive ((Income − Expenses) / Income)</option>
        </select>
      </div>
    </Card>
  );
}
