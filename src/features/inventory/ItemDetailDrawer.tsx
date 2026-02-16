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
import { getVaultDisplayName } from '@/shared/utils/friendlyNames';
import { formatGold } from '@/shared/utils/formatting';
import { getIconUrl } from '@/lib/cdn';

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

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gorgon-text-dim">Location: </span>
              <span className="text-gorgon-text">{getVaultDisplayName(item.StorageVault ?? '', indexes)}</span>
            </div>
            <div>
              <span className="text-gorgon-text-dim">Category: </span>
              <span className="text-gorgon-text">{rec.category}</span>
            </div>
            <div>
              <span className="text-gorgon-text-dim">Quantity: </span>
              <span className="text-gorgon-text font-mono">{item.StackSize}</span>
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
