import { Routes, Route, Navigate } from 'react-router-dom';
import { ImportPage } from '@/features/import/ImportPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { RelationshipsPage } from '@/features/relationships/RelationshipsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { useAppStore } from '@/lib/store';

function HomeRedirect() {
  const activeCharacter = useAppStore((s) => s.activeCharacter);
  return <Navigate to={activeCharacter ? '/dashboard' : '/import'} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/inventory/:vault" element={<InventoryPage />} />
      <Route path="/relationships" element={<RelationshipsPage />} />
      <Route path="/relationships/:npcId" element={<RelationshipsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
