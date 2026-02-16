import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnRecipe } from '@/types/cdn/recipes';
import type { GameDataIndexes } from '@/lib/cdn-indexes';

export interface RecipeMatch {
  recipe: CdnRecipe;
  canCraftNow: boolean;
  reason: string;
}

/**
 * Find all recipes that use this inventory item as an ingredient.
 * Cross-references with character's RecipeCompletions and skill levels.
 */
export function analyzeRecipeUses(
  item: InventoryItem,
  character: CharacterExport,
  indexes: GameDataIndexes,
): RecipeMatch[] {
  const recipes = indexes.recipesByIngredient.get(item.TypeID);
  if (!recipes) return [];

  const matches: RecipeMatch[] = [];

  for (const recipe of recipes) {
    // Check if character knows this recipe (has it in RecipeCompletions)
    const hasRecipe = recipe.InternalName in character.RecipeCompletions;

    // Check skill level
    const skillLevel = character.Skills[recipe.Skill]?.Level ?? 0;
    const meetsLevel = skillLevel >= recipe.SkillLevelReq;

    const canCraftNow = hasRecipe && meetsLevel;

    let reason: string;
    if (canCraftNow) {
      reason = `Can craft now: ${recipe.Name ?? recipe.InternalName} (${recipe.Skill} ${recipe.SkillLevelReq})`;
    } else if (hasRecipe && !meetsLevel) {
      reason = `Recipe known, need ${recipe.Skill} ${recipe.SkillLevelReq} (you have ${skillLevel})`;
    } else if (!hasRecipe && meetsLevel) {
      reason = `Need recipe: ${recipe.Name ?? recipe.InternalName} (${recipe.Skill})`;
    } else {
      reason = `Future: ${recipe.Name ?? recipe.InternalName} (${recipe.Skill} ${recipe.SkillLevelReq})`;
    }

    matches.push({ recipe, canCraftNow, reason });
  }

  return matches;
}

/**
 * Calculate how many of an item to keep based on recipe ingredient requirements.
 */
export function calculateRecipeKeepQuantity(
  item: InventoryItem,
  character: CharacterExport,
  indexes: GameDataIndexes,
): number | null {
  const recipes = indexes.recipesByIngredient.get(item.TypeID);
  if (!recipes) return null;

  let maxNeeded = 0;

  for (const recipe of recipes) {
    // Only count recipes the character knows or is working toward
    const hasRecipe = recipe.InternalName in character.RecipeCompletions;
    const skillLevel = character.Skills[recipe.Skill]?.Level ?? 0;

    if (hasRecipe || skillLevel > 0) {
      for (const ing of recipe.Ingredients) {
        if (ing.ItemCode === item.TypeID) {
          // Keep enough for a few crafts (stack size from recipe * 3)
          maxNeeded = Math.max(maxNeeded, ing.StackSize * 3);
        }
      }
    }
  }

  return maxNeeded > 0 ? maxNeeded : null;
}
