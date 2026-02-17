import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { detectBuild } from '@/features/recommendations/buildDetection';
import { useAnalyzedInventory } from '@/shared/hooks/useAnalyzedInventory';
import { GoldSummaryCard } from './GoldSummaryCard';
import { StorageSection } from './StorageSection';
import { ActionBreakdownCard } from './ActionBreakdownCard';
import { CharacterPanel } from './CharacterPanel';
import { NpcPriorityWidget } from './NpcPriorityWidget';
import { EmptyState } from '@/shared/components/EmptyState';

export function DashboardPage() {
  const navigate = useNavigate();
  const inventory = useAppStore((s) => s.inventory);
  const character = useAppStore((s) => s.character);
  const indexes = useAppStore((s) => s.indexes);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const setBuildConfig = useAppStore((s) => s.setBuildConfig);

  // Redirect to import if no data
  useEffect(() => {
    if (!inventory) navigate('/import', { replace: true });
  }, [inventory, navigate]);

  // Auto-detect build if not set
  useEffect(() => {
    if (character && indexes && !buildConfig) {
      const detected = detectBuild(character, indexes);
      setBuildConfig(detected);
    }
  }, [character, indexes, buildConfig, setBuildConfig]);

  const analyzed = useAnalyzedInventory();

  if (!inventory || !character || !indexes || !buildConfig) {
    return <EmptyState icon="&#9876;" title="Loading..." description="Preparing your inventory analysis" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-gorgon-text-bright tracking-wide">
          {character.Character}
        </h1>
        <p className="text-gorgon-text-dim text-sm mt-1">
          {analyzed.length} items analyzed &middot; Imported {inventory.Timestamp}
        </p>
      </div>

      {/* 3-column layout: Character+Gold | Storage | Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <CharacterPanel character={character} build={buildConfig} />
          <GoldSummaryCard analyzed={analyzed} />
        </div>

        {/* Center column (2/4) */}
        <div className="lg:col-span-2">
          <StorageSection analyzed={analyzed} indexes={indexes} character={character} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <ActionBreakdownCard analyzed={analyzed} />
          <NpcPriorityWidget />
        </div>
      </div>
    </div>
  );
}
