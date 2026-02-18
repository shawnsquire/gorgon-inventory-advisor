import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/shared/components/Card';
import { FavorProgressBar } from './FavorProgressBar';
import { NpcPriorityControls } from './NpcPriorityControls';
import { NpcGiftTable } from './NpcGiftTable';
import { NpcDislikesSection } from './NpcDislikesSection';
import { ModeToggle } from './ModeToggle';
import { useGiftMatching } from './useGiftMatching';
import { ItemDetailDrawer } from '@/features/inventory/ItemDetailDrawer';
import { detectBuild } from '@/features/recommendations/buildDetection';
import { getRecommendation } from '@/features/recommendations/engine';
import type { NpcRelationshipView, RelationshipMode, NpcGiftItem } from './types';
import { getWikiUrl } from '@/shared/utils/itemHelpers';
import type { AnalyzedItem } from '@/features/inventory/InventoryPage';

interface Props {
  npc: NpcRelationshipView;
  mode: RelationshipMode;
  onModeChange: (mode: RelationshipMode) => void;
  onBack?: () => void;
}

export function NpcDetailPanel({ npc, mode, onModeChange, onBack }: Props) {
  const indexes = useAppStore((s) => s.indexes);
  const inventory = useAppStore((s) => s.inventory);
  const character = useAppStore((s) => s.character);
  const buildConfig = useAppStore((s) => s.buildConfig);
  const overrides = useAppStore((s) => s.overrides);
  const keepQuantities = useAppStore((s) => s.keepQuantities);
  const gifts = useGiftMatching(npc.npcId, mode);

  const [selectedItem, setSelectedItem] = useState<AnalyzedItem | null>(null);

  const cdnNpc = indexes?.npcById.get(npc.npcId);

  const handleItemClick = useCallback((gift: NpcGiftItem) => {
    if (!inventory?.Items || !character || !indexes) return;

    // Find the inventory item matching this gift
    const invItem = gift.source === 'inventory'
      ? inventory.Items.find((i) => i.TypeID === gift.typeId && i.Name === gift.itemName)
      : null;

    if (!invItem) return;

    const build = buildConfig ?? detectBuild(character, indexes);
    const recommendation = getRecommendation(
      invItem, character, indexes, build, overrides, keepQuantities,
    );

    setSelectedItem({ ...invItem, recommendation, _idx: 0 });
  }, [inventory, character, indexes, buildConfig, overrides, keepQuantities]);

  return (
    <Card>
      {/* Back button (mobile) */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-gorgon-text-dim hover:text-gorgon-text mb-3 flex items-center gap-1"
        >
          <span>&larr;</span> Back to list
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display text-lg text-gorgon-text-bright">{npc.name}</h2>
          <p className="text-sm text-gorgon-text-dim">{npc.areaName}</p>
          {cdnNpc?.AreaName && cdnNpc.AreaName !== '*' && (
            <p className="text-xs text-gorgon-text-dim mt-0.5">
              {npc.isMet ? 'Met' : 'Not yet met'}
            </p>
          )}
          <a
            href={getWikiUrl(npc.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-action-blue hover:underline mt-1"
          >
            View on Wiki
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <NpcPriorityControls npcId={npc.npcId} currentStatus={npc.priority} />
      </div>

      {/* Favor progress */}
      {npc.isMet && (
        <div className="mb-4">
          <FavorProgressBar currentTier={npc.favorLevel} />
        </div>
      )}

      {/* Mode toggle + gifts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gorgon-text">
            Gift Matches ({gifts.length})
          </h3>
          <ModeToggle mode={mode} onChange={onModeChange} />
        </div>

        <NpcGiftTable gifts={gifts} onItemClick={handleItemClick} />
      </div>

      {/* Dislikes */}
      <div className="mt-4">
        <NpcDislikesSection npcId={npc.npcId} />
      </div>

      {/* Item detail drawer */}
      {character && indexes && buildConfig && (
        <ItemDetailDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          character={character}
          indexes={indexes}
          build={buildConfig}
        />
      )}
    </Card>
  );
}
