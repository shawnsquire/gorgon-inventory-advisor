import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { GameDataIndexes } from '@/lib/cdn-indexes';
import { analyzeRecipeUses } from '@/features/recommendations/recipeAnalysis';

interface Props {
  item: InventoryItem;
  character: CharacterExport;
  indexes: GameDataIndexes;
}

export function RecipeSection({ item, character, indexes }: Props) {
  const matches = analyzeRecipeUses(item, character, indexes);

  if (matches.length === 0) return null;

  const craftable = matches.filter((m) => m.canCraftNow);
  const future = matches.filter((m) => !m.canCraftNow);

  return (
    <div>
      <h3 className="text-xs text-gorgon-text-dim uppercase tracking-wide mb-2">
        Recipes Using This Item ({matches.length})
      </h3>

      {craftable.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-action-green mb-1">Can Craft Now</p>
          {craftable.map((m, i) => (
            <div key={i} className="text-sm text-gorgon-text pl-3 border-l-2 border-action-green mb-1">
              <span className="font-medium">{m.recipe.Name ?? m.recipe.InternalName}</span>
              <span className="text-gorgon-text-dim ml-1">
                ({m.recipe.Skill} {m.recipe.SkillLevelReq})
              </span>
            </div>
          ))}
        </div>
      )}

      {future.length > 0 && (
        <div>
          <p className="text-xs text-action-yellow mb-1">Future Potential</p>
          {future.slice(0, 5).map((m, i) => (
            <div key={i} className="text-sm text-gorgon-text-dim pl-3 border-l-2 border-gorgon-border mb-1">
              {m.reason}
            </div>
          ))}
          {future.length > 5 && (
            <p className="text-xs text-gorgon-text-dim ml-3">...and {future.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  );
}
