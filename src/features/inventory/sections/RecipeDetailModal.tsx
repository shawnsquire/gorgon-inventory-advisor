import { useEffect } from 'react';
import type { CdnRecipe } from '@/types/cdn/recipes';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import type { InventoryItem } from '@/types/inventory';

interface Props {
  recipe: CdnRecipe;
  indexes: GameDataIndexes;
  inventoryItems: InventoryItem[];
  onClose: () => void;
}

export function RecipeDetailModal({ recipe, indexes, inventoryItems, onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Build ingredient analysis
  const ingredients = (recipe.Ingredients ?? []).map((ing) => {
    const cdnItem = indexes.itemsByTypeId.get(ing.ItemCode);
    const name = cdnItem?.Name ?? `Item #${ing.ItemCode}`;

    // Sum up all matching inventory items across all vaults
    let owned = 0;
    for (const item of inventoryItems) {
      if (item.TypeID === ing.ItemCode) {
        owned += item.StackSize;
      }
    }

    const needed = ing.StackSize;
    const deficit = needed - owned;

    return { name, needed, owned, deficit, itemCode: ing.ItemCode };
  });

  // Build result items analysis
  const results = (recipe.ResultItems ?? []).map((res) => {
    const cdnItem = indexes.itemsByTypeId.get(res.ItemCode);
    const name = cdnItem?.Name ?? `Item #${res.ItemCode}`;

    let currentlyOwned = 0;
    for (const item of inventoryItems) {
      if (item.TypeID === res.ItemCode) {
        currentlyOwned += item.StackSize;
      }
    }

    return { name, quantity: res.StackSize, currentlyOwned };
  });

  const canCraft = ingredients.every((i) => i.deficit <= 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-4 top-[10%] bottom-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg
                    bg-gorgon-panel border border-gorgon-border rounded-lg shadow-2xl z-50
                    flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gorgon-border shrink-0">
          <div>
            <h3 className="font-display text-sm text-gorgon-text-bright">
              {recipe.Name ?? recipe.InternalName}
            </h3>
            <p className="text-xs text-gorgon-text-dim">
              {recipe.Skill} Level {recipe.SkillLevelReq}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gorgon-text-dim hover:text-gorgon-text text-lg p-1"
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 flex-1 space-y-4">
          {/* Ingredients */}
          <div>
            <h4 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
              Ingredients
            </h4>
            <div className="space-y-1.5">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gorgon-text">{ing.name}</span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className={ing.deficit > 0 ? 'text-action-red' : 'text-action-green'}>
                      {ing.owned}
                    </span>
                    <span className="text-gorgon-text-dim">/</span>
                    <span className="text-gorgon-text-dim">{ing.needed}</span>
                    {ing.deficit > 0 && (
                      <span className="text-action-red">(-{ing.deficit})</span>
                    )}
                    {ing.deficit <= 0 && ing.owned > ing.needed && (
                      <span className="text-action-green">(+{-ing.deficit})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div>
              <h4 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
                Produces
              </h4>
              <div className="space-y-1.5">
                {results.map((res, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gorgon-text">{res.name}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-action-cyan font-mono">x{res.quantity}</span>
                      {res.currentlyOwned > 0 && (
                        <span className="text-gorgon-text-dim">(own {res.currentlyOwned})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* After crafting prediction */}
          <div>
            <h4 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
              After Crafting
            </h4>
            <div className="space-y-1 text-sm">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gorgon-text-dim">{ing.name}</span>
                  <span className="font-mono text-xs text-gorgon-text">
                    {Math.max(0, ing.owned - ing.needed)} remaining
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className={`text-center text-sm py-2 rounded ${
            canCraft
              ? 'text-action-green bg-action-green/10 border border-action-green/20'
              : 'text-action-yellow bg-action-yellow/10 border border-action-yellow/20'
          }`}>
            {canCraft ? 'Ready to craft' : 'Missing ingredients'}
          </div>
        </div>
      </div>
    </>
  );
}
