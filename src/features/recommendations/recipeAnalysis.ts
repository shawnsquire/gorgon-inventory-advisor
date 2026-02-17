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
 * Sums across all relevant recipes (player needs stock for all of them).
 * Known recipes get 10x multiplier, speculative recipes get 3x.
 * Capped at MaxStackSize.
 */
export function calculateRecipeKeepQuantity(
  item: InventoryItem,
  character: CharacterExport,
  indexes: GameDataIndexes,
): number | null {
  const recipes = indexes.recipesByIngredient.get(item.TypeID);
  if (!recipes) return null;

  let totalNeeded = 0;

  for (const recipe of recipes) {
    const hasRecipe = recipe.InternalName in character.RecipeCompletions;
    const skillLevel = character.Skills[recipe.Skill]?.Level ?? 0;

    // Skip recipes the character has no connection to
    if (!hasRecipe && skillLevel <= 0) continue;

    for (const ing of recipe.Ingredients) {
      if (ing.ItemCode !== item.TypeID) continue;
      // 10x for known recipes (actively crafted), 3x for speculative
      totalNeeded += ing.StackSize * (hasRecipe ? 10 : 3);
    }
  }

  if (totalNeeded === 0) return null;

  // Cap keep quantity at MaxStackSize if available
  const cdnItem = indexes.itemsByTypeId.get(item.TypeID);
  if (cdnItem?.MaxStackSize && totalNeeded > cdnItem.MaxStackSize) {
    totalNeeded = cdnItem.MaxStackSize;
  }

  return totalNeeded;
}
