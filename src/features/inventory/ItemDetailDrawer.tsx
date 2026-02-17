import type { AnalyzedItem } from './InventoryPage';
import type { CharacterExport } from '@/types/character';
import type { BuildConfig } from '@/types/recommendations';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { Drawer } from '@/shared/components/Drawer';
import { ActionLabel, RarityBadge } from '@/shared/components/Badge';
import { RecipeSection } from './sections/RecipeSection';
import { QuestSection } from './sections/QuestSection';
import { GiftSection } from './sections/GiftSection';
import { GearPowersSection } from './sections/GearPowersSection';
import { SourcesSection } from './sections/SourcesSection';
import { OverrideControls } from './OverrideControls';
import { getVaultDisplayName, formatArea, PLAYER_INVENTORY } from '@/shared/utils/friendlyNames';
import { formatGold } from '@/shared/utils/formatting';
import { getIconUrl } from '@/lib/cdn';
import { getItemWikiUrl } from '@/shared/utils/itemHelpers';

interface Props {
  item: AnalyzedItem | null;
  onClose: () => void;
  character: CharacterExport;
  indexes: GameDataIndexes;
  build: BuildConfig;
}

export function ItemDetailDrawer({ item, onClose, character, indexes, build }: Props) {
  if (!item) return null;

  const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
  const rec = item.recommendation;
  const totalValue = item.Value * item.StackSize;

  return (
    <Drawer open={!!item} onClose={onClose} title={item.Name}>
      <div className="space-y-5">
        {/* Header info */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            {cdnItem?.IconId && (
              <img
                src={getIconUrl(cdnItem.IconId)}
                alt=""
                width={48}
                height={48}
                className="rounded shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <ActionLabel actionType={rec.action.type} />
              {item.Rarity && <RarityBadge rarity={item.Rarity} />}
              {item.Level && (
                <span className="text-sm text-gorgon-text-dim">Level {item.Level}</span>
              )}
              {rec.gearScore != null && (
                <span className="text-sm font-mono text-action-blue">
                  Score: {rec.gearScore}/100
                </span>
              )}
            </div>
          </div>

          <a
            href={getItemWikiUrl(item.Name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-action-blue hover:underline mb-1"
          >
            View on Wiki
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              {(() => {
                const vaultId = item.StorageVault ?? PLAYER_INVENTORY;
                const vault = vaultId !== PLAYER_INVENTORY ? indexes.vaultsByInternalName.get(vaultId) : undefined;
                if (vault) {
                  return (
                    <div className="flex flex-col">
                      <span className="text-gorgon-text">{vault.NpcFriendlyName}</span>
                      <span className="text-gorgon-text-dim text-xs">{formatArea(vault.Area)}</span>
                    </div>
                  );
                }
                return (
                  <span className="text-gorgon-text">{getVaultDisplayName(vaultId, indexes)}</span>
                );
              })()}
            </div>
            <div>
              <span className="text-gorgon-text-dim">Category: </span>
              <span className="text-gorgon-text">{rec.category}</span>
            </div>
            <div>
              <span className="text-gorgon-text-dim">Quantity: </span>
              <span className="text-gorgon-text font-mono">
                {item.StackSize}
                {cdnItem?.MaxStackSize && cdnItem.MaxStackSize > 1 && (
                  <span className="text-gorgon-text-dim"> / {cdnItem.MaxStackSize}</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-gorgon-text-dim">Value: </span>
              <span className="text-action-yellow font-mono">
                {formatGold(totalValue)}
                {item.StackSize > 1 && ` (${formatGold(item.Value)} each)`}
              </span>
            </div>
            {item.Slot && (
              <div>
                <span className="text-gorgon-text-dim">Slot: </span>
                <span className="text-gorgon-text">{item.Slot}</span>
              </div>
            )}
            {item.Durability != null && (
              <div>
                <span className="text-gorgon-text-dim">Durability: </span>
                <span className="text-gorgon-text font-mono">{item.Durability}</span>
              </div>
            )}
          </div>

          {cdnItem?.Description && (
            <p className="text-sm text-gorgon-text-dim mt-2 italic">{cdnItem.Description}</p>
          )}
        </div>

        {/* Reasons */}
        <div>
          <h3 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">Recommendation Reasons</h3>
          <div className="space-y-1">
            {rec.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`text-xs mt-0.5 shrink-0 ${
                  reason.confidence === 'high' ? 'text-action-green' :
                  reason.confidence === 'medium' ? 'text-action-yellow' :
                  'text-gorgon-text-dim'
                }`}>
                  {reason.confidence === 'high' ? '\u25CF' : reason.confidence === 'medium' ? '\u25CB' : '\u25CB'}
                </span>
                <div>
                  <span className="text-gorgon-text">{reason.text}</span>
                  {reason.detail && (
                    <span className="text-gorgon-text-dim ml-1">({reason.detail})</span>
                  )}
                  <span className="text-xs text-gorgon-text-dim ml-1">[{reason.type}]</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gear Powers (equipment only) */}
        {item.TSysPowers && item.TSysPowers.length > 0 && (
          <GearPowersSection item={item} indexes={indexes} build={build} />
        )}

        {/* Recipe uses */}
        <RecipeSection item={item} character={character} indexes={indexes} />

        {/* Quest matches */}
        <QuestSection item={item} cdnItem={cdnItem ?? null} character={character} indexes={indexes} />

        {/* Gift suggestions */}
        <GiftSection item={item} cdnItem={cdnItem ?? null} character={character} indexes={indexes} />

        {/* Sources */}
        <SourcesSection cdnItem={cdnItem ?? null} indexes={indexes} />

        {/* Override controls */}
        <OverrideControls
          itemName={item.Name}
          overrideKey={`${item.TypeID}_${item.StorageVault}`}
        />
      </div>
    </Drawer>
  );
}
