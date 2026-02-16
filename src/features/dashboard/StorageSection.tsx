import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InventoryItem } from '@/types/inventory';
import type { Recommendation } from '@/types/recommendations';
import type { CharacterExport } from '@/types/character';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import type { CdnStorageVault } from '@/types/cdn/storagevaults';
import { Card } from '@/shared/components/Card';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { getVaultShortName, formatArea } from '@/shared/utils/friendlyNames';
import { countByVault } from '@/shared/utils/itemHelpers';
import { favorLabel, favorColor, getVaultCapacity, getMinFavorForAccess } from '@/shared/utils/favor';

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
  grouping: string;
}

interface DiscoveredVault {
  key: string;
  vault: CdnStorageVault;
  npcName: string;
  area: string;
  grouping: string;
  slots: number;
  restriction?: string;
  requiredFavor?: string;
  playerFavor?: string;
}

interface AreaGroup {
  grouping: string;
  label: string;
  vaults: DiscoveredVault[];
}

/** Keys to skip in Available/Locked sections */
function shouldSkipVault(key: string, vault: CdnStorageVault): boolean {
  if (vault.Area === '*') return true;
  if (key.startsWith('AccountStorage_') || key === 'AdminStorage') return true;
  if (vault.NumSlotsScriptAtomic) return true;
  return false;
}

function groupByArea(vaults: DiscoveredVault[]): AreaGroup[] {
  const groups = new Map<string, DiscoveredVault[]>();
  for (const v of vaults) {
    const list = groups.get(v.grouping) || [];
    list.push(v);
    groups.set(v.grouping, list);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => a.npcName.localeCompare(b.npcName));
  }

  return [...groups.entries()]
    .map(([grouping, list]) => ({
      grouping,
      label: formatArea(grouping),
      vaults: list,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function StorageSection({ analyzed, indexes, character }: Props) {
  const navigate = useNavigate();
  const counts = countByVault(analyzed);
  const [showAvailable, setShowAvailable] = useState(false);
  const [showLocked, setShowLocked] = useState(false);

  // --- Active Vaults grouped by area ---
  const activeGroups = useMemo(() => {
    const vaults: ActiveVault[] = Object.entries(counts)
      .map(([vaultId, count]) => {
        const vault = indexes.vaultsByInternalName.get(vaultId);
        let capacity: number;
        if (vault?.Levels) {
          const npcFavor = character.NPCs[vaultId]?.FavorLevel;
          capacity = getVaultCapacity(vault.Levels, npcFavor);
          if (capacity === 0) capacity = count; // fallback: player has items but we can't resolve capacity
        } else {
          capacity = vault?.NumSlots ?? count;
        }
        const name = getVaultShortName(vaultId, indexes);
        const removable = analyzed.filter(
          (item) =>
            item.StorageVault === vaultId &&
            ['SELL_ALL', 'SELL_SOME', 'DISENCHANT'].includes(item.recommendation.action.type),
        ).length;
        const grouping = vault?.Grouping ?? vault?.Area ?? 'Unknown';
        return { vaultId, name, count, capacity, removable, grouping };
      });

    // Group by area
    const groups = new Map<string, ActiveVault[]>();
    for (const v of vaults) {
      const list = groups.get(v.grouping) || [];
      list.push(v);
      groups.set(v.grouping, list);
    }

    // Sort vaults within each group by count desc
    for (const list of groups.values()) {
      list.sort((a, b) => b.count - a.count);
    }

    // Sort groups by total item count desc
    return [...groups.entries()]
      .map(([grouping, list]) => ({
        grouping,
        label: formatArea(grouping),
        vaults: list,
        totalCount: list.reduce((s, v) => s + v.count, 0),
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [analyzed, counts, indexes, character]);

  // --- Available & Locked vaults ---
  const { available, locked } = useMemo(() => {
    const activeVaultIds = new Set(Object.keys(counts));
    const availableVaults: DiscoveredVault[] = [];
    const lockedVaults: DiscoveredVault[] = [];

    for (const [key, vault] of indexes.vaultsByInternalName) {
      if (activeVaultIds.has(key)) continue;
      if (shouldSkipVault(key, vault)) continue;

      // Only process NPC vaults with Levels (favor-based capacity)
      if (vault.Levels) {
        const playerFavor = character.NPCs[key]?.FavorLevel;
        const capacity = getVaultCapacity(vault.Levels, playerFavor);
        const grouping = vault.Grouping ?? vault.Area;

        if (capacity > 0) {
          availableVaults.push({
            key,
            vault,
            npcName: vault.NpcFriendlyName,
            area: vault.Area,
            grouping,
            slots: capacity,
            restriction: vault.RequirementDescription,
          });
        } else {
          const minFavor = getMinFavorForAccess(vault.Levels);
          if (minFavor) {
            lockedVaults.push({
              key,
              vault,
              npcName: vault.NpcFriendlyName,
              area: vault.Area,
              grouping,
              slots: 0,
              requiredFavor: minFavor,
              playerFavor,
            });
          }
        }
      }
      // Skip chests with Requirements from Available/Locked — can't determine access
    }

    return { available: groupByArea(availableVaults), locked: groupByArea(lockedVaults) };
  }, [indexes, counts, character]);

  return (
    <div className="space-y-4">
      {/* Active Vaults */}
      <Card title="Active Vaults">
        <div className="space-y-4">
          {activeGroups.map(({ grouping, label, vaults }) => (
            <div key={grouping}>
              <h4 className="text-xs font-semibold text-gorgon-text-dim uppercase tracking-wide mb-2">
                {label}
              </h4>
              <div className="space-y-2">
                {vaults.map(({ vaultId, name, count, capacity, removable }) => (
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
            </div>
          ))}
        </div>
      </Card>

      {/* Available Storage */}
      {available.length > 0 && (
        <Card>
          <button
            onClick={() => setShowAvailable((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-display text-base text-gorgon-text-bright">
              Available Storage
              <span className="ml-2 text-xs font-normal text-gorgon-text-dim">
                ({available.reduce((s, g) => s + g.vaults.length, 0)})
              </span>
            </h3>
            <span className="text-gorgon-text-dim text-sm">{showAvailable ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showAvailable && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-gorgon-text-dim">
                Unlocked vaults you haven&apos;t used yet
              </p>
              {available.map(({ grouping, label, vaults }) => (
                <div key={grouping}>
                  <h4 className="text-xs font-semibold text-gorgon-text-dim uppercase tracking-wide mb-1">
                    {label}
                  </h4>
                  <div className="space-y-1">
                    {vaults.map(({ key, npcName, slots, restriction }) => (
                      <div key={key} className="flex items-center justify-between bg-gorgon-panel rounded px-3 py-2">
                        <div>
                          <span className="text-sm text-gorgon-text-bright">{npcName}</span>
                          {restriction && (
                            <span className="text-xs text-gorgon-text-dim ml-2">({restriction})</span>
                          )}
                        </div>
                        <span className="text-xs text-action-green font-mono">{slots} slots</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Locked Storage */}
      {locked.length > 0 && (
        <Card>
          <button
            onClick={() => setShowLocked((v) => !v)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-display text-base text-gorgon-text-bright">
              Locked Storage
              <span className="ml-2 text-xs font-normal text-gorgon-text-dim">
                ({locked.reduce((s, g) => s + g.vaults.length, 0)})
              </span>
            </h3>
            <span className="text-gorgon-text-dim text-sm">{showLocked ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showLocked && (
            <div className="mt-3 space-y-3">
              {locked.map(({ grouping, label, vaults }) => (
                <div key={grouping}>
                  <h4 className="text-xs font-semibold text-gorgon-text-dim uppercase tracking-wide mb-1">
                    {label}
                  </h4>
                  <div className="space-y-1">
                    {vaults.map(({ key, npcName, requiredFavor, playerFavor }) => (
                      <div key={key} className="flex items-center justify-between bg-gorgon-panel/50 rounded px-3 py-2 opacity-60">
                        <div>
                          <span className="text-sm text-gorgon-text">{npcName}</span>
                          {playerFavor && (
                            <span className={`text-xs ml-2 ${favorColor(playerFavor)}`}>
                              ({favorLabel(playerFavor)})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gorgon-text-dim">
                          Requires: {favorLabel(requiredFavor ?? 'Unknown')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
