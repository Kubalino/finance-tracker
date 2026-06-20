import CategoryEditor from '../components/settings/CategoryEditor';
import SettingsForm from '../components/settings/SettingsForm';
import AuthPanel from '../components/settings/AuthPanel';
import DataManagement from '../components/settings/DataManagement';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import styles from './Settings.module.css';

export default function Settings() {
  const categoriesApi = useCategories();
  const { settings, updateSettings } = useSettings();

  const dataLoaded = settings && !categoriesApi.loading;

  return (
    <div className={styles.page}>
      {dataLoaded && (
        <>
          <CategoryEditor
            byType={categoriesApi.byType}
            addCategory={categoriesApi.addCategory}
            renameCategory={categoriesApi.renameCategory}
            reorderCategory={categoriesApi.reorderCategory}
            deleteCategory={categoriesApi.deleteCategory}
          />

          <SettingsForm settings={settings} onUpdate={updateSettings} />
        </>
      )}

      <AuthPanel onDataChanged={() => window.location.reload()} />

      {dataLoaded && <DataManagement onDataChanged={() => window.location.reload()} />}
    </div>
  );
}
