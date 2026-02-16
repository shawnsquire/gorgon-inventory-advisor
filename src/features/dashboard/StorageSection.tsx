import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InventoryItem } from '@/types/inventory';
import type { Recommendation } from '@/types/recommendations';
import type { CharacterExport } from '@/types/character';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import type { CdnStorageVault } from '@/types/cdn/storagevaults';
import { Card } from '@/shared/components/Card';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { getVaultShortName } from '@/shared/utils/friendlyNames';
import { countByVault } from '@/shared/utils/itemHelpers';
import { favorRank, favorLabel, favorColor, meetsRequiredFavor } from '@/shared/utils/favor';

type AnalyzedItem = InventoryItem & { recommendation: Recommendation };

interface Props {
  analyzed: AnalyzedItem[];
  indexes: GameDataIndexes;
  character: CharacterExport;
}

interface ActiveVault {
  vaultId: string;
  name: string;
  count: number;
  capacity: number;
  removable: number;
}

interface DiscoveredVault {
  key: string;
  vault: CdnStorageVault;
  npcName: string;
  area: string;
  slots: number;
}

export function StorageSection({ analyzed, indexes, character }: Props) {
  const navigate = useNavigate();
  const counts = countByVault(analyzed);

  const activeVaults = useMemo<ActiveVault[]>(() => {
    return Object.entries(counts)
      .map(([vaultId, count]) => {
        const vault = indexes.vaultsByInternalName.get(vaultId);
        const capacity = vault?.NumSlots ?? count;
        const name = getVaultShortName(vaultId, indexes);
        const removable = analyzed.filter(
          (item) =>
            item.StorageVault === vaultId &&
            ['SELL_ALL', 'SELL_SOME', 'DISENCHANT'].includes(item.recommendation.action.type),
        ).length;
        return { vaultId, name, count, capacity, removable };
      })
      .sort((a, b) => b.count - a.count);
  }, [analyzed, counts, indexes]);

  const { available, locked } = useMemo(() => {
    const activeVaultIds = new Set(Object.keys(counts));
    const availableVaults: DiscoveredVault[] = [];
    const lockedVaults: DiscoveredVault[] = [];
    const seenGroups = new Set<number>();

    for (const [key, vault] of indexes.vaultsByInternalName) {
      // Skip vaults the player already has items in
      if (activeVaultIds.has(key)) continue;

      // Deduplicate by GroupId (multiple upgrade tiers of same vault)
      if (vault.GroupId != null) {
        if (seenGroups.has(vault.GroupId)) continue;
        seenGroups.add(vault.GroupId);
      }

      // Determine what favor is required
      const requiredFavor = vault.RequiredFavorLevel ?? getFirstRequiredFavor(vault);
      if (!requiredFavor) continue; // Skip vaults with no favor requirement (can't determine access)

      const npcId = getNpcIdForVault(key, vault);
      const playerFavor = npcId ? character.NPCs[npcId]?.FavorLevel : undefined;

      const entry: DiscoveredVault = {
        key,
        vault,
        npcName: vault.NpcFriendlyName,
        area: vault.Area,
        slots: vault.NumSlots,
      };

      if (meetsRequiredFavor(playerFavor, requiredFavor)) {
        availableVaults.push(entry);
      } else {
        lockedVaults.push(entry);
      }
    }

    availableVaults.sort((a, b) => a.npcName.localeCompare(b.npcName));
    lockedVaults.sort((a, b) => a.npcName.localeCompare(b.npcName));

    return { available: availableVaults, locked: lockedVaults };
  }, [indexes, counts, character]);

  return (
    <div className="space-y-4">
      {/* Active Vaults */}
      <Card title="Active Vaults">
        <div className="space-y-2">
          {activeVaults.map(({ vaultId, name, count, capacity, removable }) => (
            <button
              key={vaultId}
              onClick={() => navigate(`/inventory/${encodeURIComponent(vaultId)}`)}
              className="w-full text-left bg-gorgon-panel border border-gorgon-border rounded-lg
                         px-4 py-3 hover:bg-gorgon-hover transition-colors"
            >
              <ProgressBar
                value={count}
                max={capacity}
                label={name}
                colorClass={
                  count / capacity > 0.9
                    ? 'bg-action-red'
                    : count / capacity > 0.7
                      ? 'bg-action-yellow'
                      : 'bg-action-green'
                }
              />
              {removable > 0 && (
                <span className="inline-block mt-1 text-xs text-action-red bg-action-red-dim px-2 py-0.5 rounded">
                  {removable} to clear
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Available Storage */}
      {available.length > 0 && (
        <Card title="Available Storage">
          <p className="text-xs text-gorgon-text-dim mb-2">
            Unlocked vaults you haven&apos;t used yet
          </p>
          <div className="space-y-1">
            {available.map(({ key, npcName, area, slots }) => (
              <div key={key} className="flex items-center justify-between bg-gorgon-panel rounded px-3 py-2">
                <div>
                  <span className="text-sm text-gorgon-text-bright">{npcName}</span>
                  <span className="text-xs text-gorgon-text-dim ml-2">{area}</span>
                </div>
                <span className="text-xs text-action-green font-mono">{slots} slots</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Locked Storage */}
      {locked.length > 0 && (
        <Card title="Locked Storage">
          <div className="space-y-1">
            {locked.map(({ key, vault, npcName, area, slots }) => {
              const req = vault.RequiredFavorLevel ?? getFirstRequiredFavor(vault) ?? 'Unknown';
              const npcId = getNpcIdForVault(key, vault);
              const playerFavor = npcId ? character.NPCs[npcId]?.FavorLevel : undefined;
              return (
                <div key={key} className="flex items-center justify-between bg-gorgon-panel/50 rounded px-3 py-2 opacity-60">
                  <div>
                    <span className="text-sm text-gorgon-text">{npcName}</span>
                    <span className="text-xs text-gorgon-text-dim ml-2">{area}</span>
                    {playerFavor && (
                      <span className={`text-xs ml-2 ${favorColor(playerFavor)}`}>
                        ({favorLabel(playerFavor)})
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-gorgon-text-dim">
                      Requires: {favorLabel(req)}
                    </span>
                    <span className="text-xs text-gorgon-text-dim ml-2 font-mono">{slots} slots</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

/** Extract the NPC ID from a vault key. Vault keys often match NPC InternalNames or contain the NPC name. */
function getNpcIdForVault(vaultKey: string, vault: CdnStorageVault): string | null {
  // RequiredFavor is Record<npcId, favorLevel> — first key is the NPC
  if (vault.RequiredFavor) {
    const npcIds = Object.keys(vault.RequiredFavor);
    if (npcIds.length > 0) return npcIds[0];
  }
  // Fallback: try to match NpcFriendlyName in character NPCs
  return null;
}

/** Get the first required favor level from the RequiredFavor map. */
function getFirstRequiredFavor(vault: CdnStorageVault): string | undefined {
  if (!vault.RequiredFavor) return undefined;
  const values = Object.values(vault.RequiredFavor);
  return values.length > 0 ? values[0] : undefined;
}
