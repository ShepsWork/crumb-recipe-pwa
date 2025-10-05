# Nutrition Information Feature

## Overview
Added comprehensive nutrition information extraction and display to the Crumb Recipe PWA. Nutrition data is automatically extracted from supported recipe plugins when available.

## Supported Plugins

### ✅ WPRM (WordPress Recipe Maker)
Full nutrition support with the following fields:
- Calories (kcal)
- Total Fat (g)
- Saturated Fat (g)
- Trans Fat (g)
- Cholesterol (mg)
- Sodium (mg)
- Total Carbohydrates (g)
- Dietary Fiber (g)
- Sugars (g)
- Protein (g)

**Example:** Kitchen Sanctuary recipes include detailed nutrition facts per serving.

### ⚠️ Cooked Plugin
Basic support added but most Cooked sites don't include nutrition data in their HTML output.

### ⚠️ Other Plugins
- **Tasty Recipes**: Not yet implemented (can be added if needed)
- **JSON-LD**: Not implemented (schema.org nutrition data extraction can be added)

## Data Structure

### Type Definition
```typescript
export type NutritionInfo = {
  servingSize?: string;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrates?: number;
  dietaryFiber?: number;
  sugars?: number;
  protein?: number;
};
```

### Recipe Type
```typescript
export type Recipe = {
  // ... other fields
  nutrition?: NutritionInfo; // optional nutrition facts
};
```

## UI Display

The nutrition section appears on the recipe detail page as a grid of cards showing:
- **Primary metrics** (Calories, Protein, Carbs, Total Fat) in the first row
- **Additional details** (Saturated Fat, Cholesterol, Sodium, Fiber, Sugars) below

### Visual Design
- Gray background cards (`bg-gray-50`)
- Clear labels in gray text
- Bold values in dark text
- Responsive grid: 2 columns on mobile, 3 on desktop
- Only shown if nutrition data exists

## Example Output

### Kitchen Sanctuary - Air Fryer Donut Holes
```json
{
  "nutrition": {
    "calories": 74,
    "protein": 2,
    "totalCarbohydrates": 12,
    "totalFat": 2,
    "saturatedFat": 1,
    "transFat": 0.1,
    "cholesterol": 6,
    "sodium": 4,
    "dietaryFiber": 1,
    "sugars": 4
  }
}
```

**Displayed as:**
```
Nutrition Facts
┌─────────────┬─────────────┬─────────────┐
│ Calories    │ Protein     │ Carbs       │
│    74       │    2g       │   12g       │
├─────────────┼─────────────┼─────────────┤
│ Total Fat   │ Sat. Fat    │ Cholesterol │
│    2g       │    1g       │   6mg       │
├─────────────┼─────────────┼─────────────┤
│ Sodium      │ Fiber       │ Sugars      │
│    4mg      │    1g       │   4g        │
└─────────────┴─────────────┴─────────────┘
```

## Testing

### Test Recipe with Nutrition
```bash
curl -X POST http://localhost:5554/api/import \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.kitchensanctuary.com/wprm_print/air-fryer-donut-holes-recipe"}'
```

### Expected Keys
- `calories`
- `totalFat`
- `saturatedFat`
- `transFat`
- `cholesterol`
- `sodium`
- `totalCarbohydrates`
- `dietaryFiber`
- `sugars`
- `protein`

## Implementation Notes

### Backend Extraction
Located in `server/extractors/plugins.js`:
- WPRM uses CSS selectors: `.wprm-nutrition-label-text-nutrition-container-{field}`
- Cooked uses text matching for nutrition labels
- Values are parsed as floats
- Empty nutrition objects are not stored (if no data found)

### Frontend Display
Located in `src/pages/RecipeDetail.tsx`:
- Conditional rendering: only shows if `recipe.nutrition` exists
- Each field checked individually before display
- Units appended appropriately (g, mg, kcal)

## Future Enhancements

### Potential Additions
1. **JSON-LD Schema.org extraction** - Many sites include nutrition in structured data
2. **Tasty Recipes plugin** - Add nutrition extraction for this popular plugin
3. **Serving size context** - Display "per serving" or "per donut hole" from recipe metadata
4. **Nutrition scaling** - Adjust nutrition when recipe multiplier changes
5. **Daily Value percentages** - Calculate %DV based on 2000 calorie diet
6. **Additional fields** - Vitamin A, Vitamin C, Calcium, Iron if available
7. **Macros visualization** - Pie chart showing protein/carbs/fat breakdown

## Known Limitations

1. **Not universally available** - Many recipes don't include nutrition data
2. **Accuracy varies** - Depends on recipe author's calculations
3. **No automatic calculation** - We extract what's provided, don't compute from ingredients
4. **Per-serving assumption** - May not always be clear what the serving size represents
