import CategoryEditor from '../components/settings/CategoryEditor';
import SettingsForm from '../components/settings/SettingsForm';
import DataManagement from '../components/settings/DataManagement';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import styles from './Settings.module.css';

export default function Settings() {
  const categoriesApi = useCategories();
  const { settings, updateSettings } = useSettings();

  if (!settings || categoriesApi.loading) return null;

  return (
    <div className={styles.page}>
      <CategoryEditor
        byType={categoriesApi.byType}
        addCategory={categoriesApi.addCategory}
        renameCategory={categoriesApi.renameCategory}
        reorderCategory={categoriesApi.reorderCategory}
        deleteCategory={categoriesApi.deleteCategory}
      />

      <SettingsForm settings={settings} onUpdate={updateSettings} />

      <DataManagement onDataChanged={() => window.location.reload()} />
    </div>
  );
}
