import type { InventoryItem } from '@/types/inventory';
import type { CharacterExport } from '@/types/character';
import type { CdnItem } from '@/types/cdn/items';
import type { ActionType, ReasonEntry } from '@/types/recommendations';

/**
 * Item category strings used in recommendations.
 */
export const ITEM_CATEGORIES = {
  EQUIPMENT: 'Equipment',
  CONSUMABLE: 'Consumable',
  CRAFTING_MAT: 'Crafting Material',
  RECIPE: 'Recipe Scroll',
  GEM: 'Gem',
  QUEST_ITEM: 'Quest Item',
  FOOD_INGREDIENT: 'Food Ingredient',
  POTION: 'Potion',
  CURRENCY: 'Currency/Misc',
  TOOL: 'Tool',
  FUN: 'Fun/Event',
  PHLOGISTON: 'Phlogiston',
  JUNK: 'Junk',
  GARDENING: 'Gardening',
  ANIMAL_PART: 'Animal Part',
  KEY: 'Key/Access',
  AUGMENT: 'Augment',
  WORK_ORDER: 'Work Order',
  PAINTING: 'Painting',
} as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES];

// --- CDN-enhanced categorization using Keywords ---

export function categorizeItem(
  item: InventoryItem,
  cdnItem: CdnItem | undefined,
): ItemCategory {
  const name = item.Name;
  const keywords = cdnItem?.Keywords ?? [];

  // Equipment with slots
  if (item.Slot) return ITEM_CATEGORIES.EQUIPMENT;

  // Use CDN keywords when available
  if (keywords.includes('Augment')) return ITEM_CATEGORIES.AUGMENT;
  if (keywords.includes('Painting')) return ITEM_CATEGORIES.PAINTING;
  if (keywords.includes('Phlogiston')) return ITEM_CATEGORIES.PHLOGISTON;

  // Name-based patterns (enhanced from v1)
  if (name.includes('Augment')) return ITEM_CATEGORIES.AUGMENT;
  if (name.includes('Painting') || name.includes('Portrait')) return ITEM_CATEGORIES.PAINTING;
  if (name.match(/^(Alchemy|Cooking|Carpentry|Tailoring|Leatherworking|Saddlery|Calligraphy|Knife|Staff|Art|Sword|Psychology|Shield):/))
    return ITEM_CATEGORIES.RECIPE;
  if (name.includes('Work Order')) return ITEM_CATEGORIES.WORK_ORDER;

  // Phlogiston
  if (PHLOGISTON_NAMES.has(name)) return ITEM_CATEGORIES.PHLOGISTON;

  // Gems (CDN keyword or name match)
  if (keywords.includes('Gem') || GEM_NAMES.has(name)) return ITEM_CATEGORIES.GEM;

  // Keys
  if (KEY_PATTERNS.some((k) => name.includes(k))) return ITEM_CATEGORIES.KEY;

  // Tools
  if (TOOL_NAMES.has(name) || name.includes('Storage Crate')) return ITEM_CATEGORIES.TOOL;

  // Potions
  if (keywords.includes('Potion') || name.includes('Potion') || name.includes('Juice') || name.includes('Drink') || name.includes('Gel'))
    return ITEM_CATEGORIES.POTION;

  // Food
  if (keywords.includes('Food') || keywords.includes('Meal') || keywords.includes('Snack'))
    return ITEM_CATEGORIES.FOOD_INGREDIENT;
  if (FOOD_RAW_NAMES.has(name)) return ITEM_CATEGORIES.FOOD_INGREDIENT;
  if (name.match(/^(Bacon|Sausage|Honey Ham|Venison|Chicken|Baked|Boiled|Fried|Candied|Jerky|Steak|Drumstick|Hash|Onion Rings|Fruit Cocktail|Hardtack|Hard Roll|BBQ|Flatbread|Bowl|Roast|Juicy|Duke)/))
    return ITEM_CATEGORIES.FOOD_INGREDIENT;
  if (name.includes('Cheese') || name === 'Cave Cheese' || name === 'Butter')
    return ITEM_CATEGORIES.FOOD_INGREDIENT;

  // Gardening
  if (keywords.includes('Gardening') || GARDENING_NAMES.has(name) || name.includes('Seeds') || name.includes('Seedling'))
    return ITEM_CATEGORIES.GARDENING;

  // Fun/Event
  if (FUN_NAMES.has(name)) return ITEM_CATEGORIES.FUN;

  // Necro ingredients / Crafting materials
  if (NECRO_INGREDIENTS.has(name)) return ITEM_CATEGORIES.CRAFTING_MAT;
  if (SKIN_NAMES.has(name)) return ITEM_CATEGORIES.CRAFTING_MAT;
  if (name.match(/(Wood|Crystal|Thread|Dust|Wool|Slab|Chips|Spiderweb|Ink|Parchment|Saltpeter|Sulfur|Oil)/))
    return ITEM_CATEGORIES.CRAFTING_MAT;
  if (name.includes('Mushroom')) return ITEM_CATEGORIES.CRAFTING_MAT;
  if (name.includes('Bottle')) return ITEM_CATEGORIES.CRAFTING_MAT;

  // Animal parts
  if (name.match(/(Claw|Tail|Tooth|Teeth|Tongue|Lobe|Gallbladder|Guts|Tusk|Foot|Scales|Egg|Eyeball|Lung|Stinger|Flesh)/))
    return ITEM_CATEGORIES.ANIMAL_PART;

  // Currency
  if (COIN_NAMES.has(name) || name.includes('Calling Card'))
    return ITEM_CATEGORIES.CURRENCY;

  // Consumables
  if (name.includes('First Aid Kit') || name.includes('Armor Patch Kit') || name.includes('Blanket'))
    return ITEM_CATEGORIES.CONSUMABLE;

  // Junk
  if (JUNK_NAMES.has(name)) return ITEM_CATEGORIES.JUNK;

  return ITEM_CATEGORIES.CURRENCY;
}

/**
 * Fallback heuristic recommendation when CDN-powered analysis doesn't produce a result.
 * Port of v1 pattern-matching logic, enhanced with CDN keyword checks.
 */
export function getHeuristicRecommendation(
  item: InventoryItem,
  cdnItem: CdnItem | undefined,
  character: CharacterExport,
  category: ItemCategory,
  keepQuantities: Record<string, number>,
  defaultGemKeep: number,
): { action: ActionType; reason: ReasonEntry } | null {
  const name = item.Name;
  const skills = character.Skills;

  switch (category) {
    case ITEM_CATEGORIES.PHLOGISTON:
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Critical for Transmutation \u2014 never sell', confidence: 'high' },
      };

    case ITEM_CATEGORIES.GEM: {
      const keepQty = keepQuantities[name] ?? defaultGemKeep;
      if (item.StackSize <= keepQty) {
        return {
          action: 'KEEP',
          reason: { type: 'heuristic', text: `Keep ${keepQty} for Transmutation/crafting`, confidence: 'high' },
        };
      }
      return {
        action: 'SELL_SOME',
        reason: {
          type: 'heuristic',
          text: `Keep ${keepQty}, sell ${item.StackSize - keepQty} (${(item.StackSize - keepQty) * item.Value}g)`,
          confidence: 'high',
        },
      };
    }

    case ITEM_CATEGORIES.TOOL:
      if (name.includes('Storage Crate')) {
        return {
          action: 'KEEP',
          reason: { type: 'heuristic', text: 'Portable temp storage \u2014 keep for field use', confidence: 'high' },
        };
      }
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Essential tool \u2014 always carry', confidence: 'high' },
      };

    case ITEM_CATEGORIES.PAINTING:
      if (name === 'Unidentified Painting') {
        const artLevel = skills.ArtHistory?.Level ?? 0;
        return {
          action: 'KEEP',
          reason: {
            type: 'heuristic',
            text: `Identify for Art History XP (currently level ${artLevel}), then sell`,
            confidence: 'high',
          },
        };
      }
      return {
        action: 'SELL_ALL',
        reason: { type: 'heuristic', text: 'Identified painting \u2014 sell for gold', confidence: 'high' },
      };

    case ITEM_CATEGORIES.RECIPE: {
      const skillMatch = name.match(/^([^:]+):/);
      if (skillMatch?.[1]) {
        const recipeSkill = skillMatch[1].trim();
        const skillMap: Record<string, string> = {
          Alchemy: 'Alchemy', Cooking: 'Cooking', Carpentry: 'Carpentry',
          Tailoring: 'Tailoring', Leatherworking: 'Leatherworking',
          Saddlery: 'AnimalHandling', Calligraphy: 'Sword', Staff: 'Staff',
          Art: 'Artistry', Psychology: 'Psychology', Shield: 'Shield', Sword: 'Sword',
        };
        const mappedSkill = skillMap[recipeSkill] ?? recipeSkill;
        const skillLevel = skills[mappedSkill]?.Level ?? 0;

        if (recipeSkill === 'Saddlery') {
          return {
            action: 'KEEP',
            reason: { type: 'heuristic', text: 'Saddlery recipe \u2014 valuable for AH pet build', confidence: 'high' },
          };
        }
        if (recipeSkill === 'Knife') {
          return {
            action: 'SELL_ALL',
            reason: { type: 'heuristic', text: `Knife combat not used \u2014 sell for ${item.Value}g`, confidence: 'medium' },
          };
        }
        if (skillLevel >= 15) {
          return {
            action: 'LEVEL_LATER',
            reason: { type: 'heuristic', text: `${recipeSkill} recipe \u2014 ${mappedSkill} is level ${skillLevel}`, confidence: 'medium' },
          };
        }
        if (skillLevel <= 3 && item.Value >= 200) {
          return {
            action: 'SELL_ALL',
            reason: { type: 'heuristic', text: `${recipeSkill} skill only level ${skillLevel} \u2014 sell for ${item.Value}g`, confidence: 'medium' },
          };
        }
      }
      return {
        action: 'EVALUATE',
        reason: { type: 'heuristic', text: 'Recipe \u2014 check if skill is worth leveling', confidence: 'low' },
      };
    }

    case ITEM_CATEGORIES.POTION: {
      const goodPotions = new Set([
        'Healing Potion Extreme', 'Healing Potion Omega', 'Power Potion Extreme',
        'Regeneration Potion', 'Armor Potion Extreme', 'Fire Shield Potion',
        'Strong Psychic Resistance Potion', 'Cold Resistance Potion',
        'Steroid Drink', 'Hulking Gel', 'Enhanced Pineal Juice', 'Pineal Juice',
      ]);
      if (goodPotions.has(name)) {
        return {
          action: 'KEEP',
          reason: { type: 'heuristic', text: 'High-tier consumable \u2014 use in combat', confidence: 'high' },
        };
      }
      if (name === 'Healing Potion' || name === 'Armor Potion') {
        return {
          action: 'SELL_ALL',
          reason: { type: 'heuristic', text: `Basic potion, outleveled \u2014 sell all (${item.Value * item.StackSize}g)`, confidence: 'high' },
        };
      }
      return {
        action: 'EVALUATE',
        reason: { type: 'heuristic', text: 'Potion \u2014 check if you have better versions', confidence: 'low' },
      };
    }

    case ITEM_CATEGORIES.FOOD_INGREDIENT: {
      const gourmandLevel = skills.Gourmand?.Level ?? 0;
      const cookingLevel = skills.Cooking?.Level ?? 0;
      const keepQty = keepQuantities[name];

      if (item.Value >= 50 && !FOOD_RAW_NAMES.has(name)) {
        return {
          action: 'USE',
          reason: {
            type: 'heuristic',
            text: `Eat if new for Gourmand XP (Gourmand ${gourmandLevel}), use in combat`,
            confidence: 'medium',
          },
        };
      }
      if (keepQty != null && item.StackSize > keepQty) {
        return {
          action: 'SELL_SOME',
          reason: { type: 'heuristic', text: `Keep ${keepQty}, cook/sell rest`, confidence: 'medium' },
        };
      }
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: `Cooking ingredient (Cooking ${cookingLevel})`, confidence: 'medium' },
      };
    }

    case ITEM_CATEGORIES.GARDENING: {
      if (name === 'Strange Dirt') {
        const keepQty = keepQuantities[name] ?? 25;
        if (item.StackSize > keepQty) {
          return {
            action: 'SELL_SOME',
            reason: { type: 'heuristic', text: `Keep ${keepQty} for fertilizer, sell rest`, confidence: 'high' },
          };
        }
        return {
          action: 'INGREDIENT',
          reason: { type: 'heuristic', text: 'Fertilizer ingredient \u2014 keep for Gardening', confidence: 'high' },
        };
      }
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Gardening supply', confidence: 'medium' },
      };
    }

    case ITEM_CATEGORIES.CRAFTING_MAT: {
      const keepQty = keepQuantities[name];
      if (NECRO_INGREDIENTS.has(name)) {
        return {
          action: 'INGREDIENT',
          reason: { type: 'heuristic', text: 'Necromancy crafting material \u2014 keep for build', confidence: 'high' },
        };
      }
      if (SKIN_NAMES.has(name)) {
        const tanningLevel = skills.Tanning?.Level ?? 0;
        const kq = keepQty ?? 15;
        if (item.StackSize > kq) {
          return {
            action: 'SELL_SOME',
            reason: { type: 'heuristic', text: `Keep ${kq} for Tanning (level ${tanningLevel}), sell rest`, confidence: 'medium' },
          };
        }
        return {
          action: 'KEEP',
          reason: { type: 'heuristic', text: `Tanning material (level ${tanningLevel})`, confidence: 'medium' },
        };
      }
      if (keepQty != null && keepQty === 0) {
        return {
          action: 'SELL_ALL',
          reason: { type: 'heuristic', text: 'Low value, not actively used', confidence: 'medium' },
        };
      }
      if (keepQty != null && item.StackSize > keepQty) {
        return {
          action: 'SELL_SOME',
          reason: { type: 'heuristic', text: `Keep ${keepQty}, sell ${item.StackSize - keepQty}`, confidence: 'medium' },
        };
      }
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Crafting material', confidence: 'low' },
      };
    }

    case ITEM_CATEGORIES.ANIMAL_PART: {
      const keepQty = keepQuantities[name] ?? 3;
      if (keepQty === 0) {
        return {
          action: 'SELL_ALL',
          reason: { type: 'heuristic', text: 'Low-use animal part', confidence: 'medium' },
        };
      }
      if (item.StackSize > keepQty) {
        return {
          action: 'SELL_SOME',
          reason: { type: 'heuristic', text: `Keep ${keepQty} for quests/recipes, sell rest`, confidence: 'medium' },
        };
      }
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Possible quest/recipe use \u2014 check before selling', confidence: 'low' },
      };
    }

    case ITEM_CATEGORIES.CURRENCY: {
      if (name === 'Council Certificate') {
        return {
          action: 'KEEP',
          reason: { type: 'heuristic', text: 'High-value currency (1000g each) \u2014 save for NPC purchases', confidence: 'high' },
        };
      }
      if (name.includes('Coin') || name === 'Big Coin Sack') {
        return {
          action: 'SELL_ALL',
          reason: { type: 'heuristic', text: `Currency item \u2014 sell for ${item.Value * item.StackSize}g`, confidence: 'high' },
        };
      }
      if (name.includes('Calling Card')) {
        return {
          action: 'KEEP',
          reason: { type: 'heuristic', text: 'Goblin calling card \u2014 may have quest/favor use', confidence: 'low' },
        };
      }
      return null;
    }

    case ITEM_CATEGORIES.CONSUMABLE: {
      if (name.includes('Simple First Aid')) {
        return {
          action: 'SELL_ALL',
          reason: { type: 'heuristic', text: 'Outleveled \u2014 you have better kits', confidence: 'high' },
        };
      }
      if (name.includes('First Aid Kit') || name.includes('Armor Patch Kit')) {
        return {
          action: 'KEEP',
          reason: { type: 'heuristic', text: 'Combat supply \u2014 keep stocked', confidence: 'high' },
        };
      }
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Consumable', confidence: 'low' },
      };
    }

    case ITEM_CATEGORIES.FUN:
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Fun/event item \u2014 keep if you enjoy it', confidence: 'medium' },
      };

    case ITEM_CATEGORIES.WORK_ORDER:
      return {
        action: 'KEEP',
        reason: { type: 'heuristic', text: 'Active work order \u2014 complete for rewards', confidence: 'high' },
      };

    case ITEM_CATEGORIES.JUNK:
      return {
        action: 'SELL_ALL',
        reason: { type: 'heuristic', text: `Vendor trash \u2014 ${item.Value * item.StackSize}g`, confidence: 'high' },
      };

    case ITEM_CATEGORIES.KEY:
      return {
        action: 'QUEST',
        reason: { type: 'heuristic', text: 'Quest/dungeon access item', confidence: 'high' },
      };

    case ITEM_CATEGORIES.AUGMENT:
      return null; // Handled by engine's equipment logic

    default:
      return null;
  }
}

// --- Pattern sets (ported from v1) ---

const GEM_NAMES = new Set([
  'Quartz', 'Diamond', 'Amethyst', 'Lapis Lazuli', 'Obsidian', 'Azurite', 'Moss Agate',
  'Blue Spinel', 'Fluorite', 'Ruby', 'Emerald', 'Sapphire', 'Topaz', 'Citrine', 'Garnet',
  'Turquoise', 'Onyx', 'Opal', 'Jasper', 'Moonstone', 'Sunstone', 'Jet', 'Peridot',
  'Carnelian', 'Alexandrite', 'Aquamarine', 'Zircon', 'Malachite', 'Agate', 'Amber',
]);

const PHLOGISTON_NAMES = new Set([
  'Crude Phlogiston', 'Rough Phlogiston', 'Shoddy Phlogiston', 'Decent Phlogiston',
  'Nice Phlogiston', 'Quality Phlogiston', 'Great Phlogiston', 'Amazing Phlogiston',
]);

const TOOL_NAMES = new Set([
  'Butcher Knife', 'Skinning Knife', 'Simple Skinning Knife', 'Autopsy Kit',
  'Handsaw', 'Shovel', 'Magnifying Glass',
]);

const FUN_NAMES = new Set([
  'Small Firework', 'Small Confetti Bomb', 'Keg of Love', "Valentine's Banner",
  'Pig Juice', 'Spider Juice',
]);

const JUNK_NAMES = new Set([
  'Grass', 'Matted Hair', 'Red Game Chip', 'Basic Spore Bomb', 'Horse Apple',
  'Piece of Green Glass', 'Perfectly Round Pebble', 'Broken Necklace',
]);

const KEY_PATTERNS = [
  "Gulagra's Sigil Key", "Steven Muradrake's Lab Key", "Sarina's Backpack",
];

const NECRO_INGREDIENTS = new Set([
  'Femur', 'Rib Bone', 'Bone Meal', 'Nightmare Flesh', 'Necromancy Dust',
  'Zombified Hand', 'Skull',
]);

const FOOD_RAW_NAMES = new Set([
  'Pork Shoulder', 'Raw Chicken', 'Venison', 'Mutton', 'Egg', 'Flour', 'Salt',
  'Sugar', 'Peppercorns', 'Oregano', 'Broccoli', 'Onion', 'Beet', 'Orange',
  'Grapes', 'Red Apple', 'Large Strawberry', 'Crab Meat', 'Clownfish',
  'Sinewy Dog Meat', 'Sinewy Cat Meat', 'Sinewy Beast Meat', 'Sinewy Insect Meat',
  'Sinewy Dinosaur Meat', 'Seaweed', 'Perch', 'Grapefish', 'Hops', 'Watercress',
  'Sugarcane', 'Pixie Sugar',
]);

const GARDENING_NAMES = new Set([
  'Bottle of Fertilizer', 'Bottle of Water', 'Strange Dirt', 'Bluebell Seeds',
  'Red Aster Seeds', 'Violet Seeds', 'Dahlia Seeds', 'Daisy Seeds', 'Pansy Seeds',
  'Red Aster', 'Bluebell', 'Eternal Greens', 'Evil Grass', 'Cotton', 'Mandrake Root',
]);

const SKIN_NAMES = new Set([
  'Shoddy Animal Skin', 'Rough Animal Skin', 'Crude Animal Skin', 'Shoddy Leather Roll',
]);

const COIN_NAMES = new Set([
  'Ancient Silver Coin', 'Ancient Bronze Coin', 'Council Certificate', 'Big Coin Sack',
]);
