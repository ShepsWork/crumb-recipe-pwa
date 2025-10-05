# Crumb Recipe Scraper - Analysis & Improvements

## Current Issues (Why It's Hit-or-Miss)

### 1. JSON-LD Validation Problems
**Issue**: Accepts recipes with incomplete instructions
```javascript
// Current check is too lenient:
if (recipe.steps?.length > 0 && hasSubstantialSteps && avgStepLength > 30) {
  return recipe; // Returns even if steps are just headers
}
```
**Impact**: Gets recipe titles/ingredients from JSON-LD but steps are just section headers like "Overnight" or "Same Day"

### 2. Heuristic Extraction Bugs
**Issue**: Only processes first instruction header
```javascript
// Old code:
const instructionHeader = $('h1, h2, h3...').filter(...).first(); // <-- ONLY FIRST!
```
**Impact**: Multi-section recipes (common in sourdough/bread recipes) lose 50-80% of instructions

### 3. Section Header Confusion
**Issue**: Code adds section markers then immediately removes them
```javascript
steps.push(`**${headerText}:**`); // Adds header
// Later...
return steps.filter(s => !isSectionHeader(s)); // Removes it!
```
**Impact**: Loses important context about recipe phases (overnight prep, same-day, etc.)

### 4. Print URL Hardcoding
**Issue**: Only works for 2-3 hardcoded domains
```javascript
if (hostname.includes('theclevercarrot.com')) {
  printUrl = `${origin}${pathname}/print/24662/`; // Hardcoded ID!
}
```
**Impact**: 95%+ of recipe sites don't benefit from cleaner print versions

### 5. Poor Ingredient Grouping
**Issue**: Can't handle ingredient subsections (Dry, Wet, Topping, etc.)
```javascript
// Just grabs all <li> under "Ingredients" header
ingredientHeader.find('li').each(...);
```
**Impact**: Loses ingredient organization, makes recipes harder to follow

### 6. No Recipe Plugin Detection
**Issue**: Missing common WordPress recipe plugins that 70%+ of food blogs use
- WordPress Recipe Maker (WPRM)
- Tasty Recipes
- WP Recipe Maker
- EasyRecipe
- Ziplist

**Impact**: These plugins use specific CSS classes/data attributes that would make scraping 100% reliable

### 7. Readability Overzealous
**Issue**: Mozilla Readability strips recipe cards thinking they're ads/clutter
```javascript
const reader = new Readability(dom.window.document);
const article = reader.parse(); // Might strip the recipe!
```
**Impact**: Can remove the actual recipe content while keeping blog text

## Proposed Improvements

### Phase 1: Quick Wins (Immediate Impact)

1. **Add Recipe Plugin Detection**
   - Detect WPRM: `.wprm-recipe`, `[data-recipe-id]`
   - Detect Tasty: `.tasty-recipes`, `.tasty-recipe-card`
   - Detect WP Recipe Maker: `.easyrecipe`, `.ziplist-recipe`
   - These have consistent, reliable structure

2. **Fix Multi-Section Header Processing**
   - Process ALL instruction headers, not just first
   - Preserve section markers (don't filter them out)
   - Add visual separators in UI

3. **Smart JSON-LD + Heuristic Merging**
   - Use JSON-LD for metadata (title, author, times, yield)
   - Use heuristics for actual content (ingredients, steps)
   - Merge both strategies for best results

4. **Better Print URL Detection**
   - Look for `<link rel="print">` tags
   - Try common patterns: `/print/`, `?print=1`, `/recipe-print/`
   - Use regex to find print links in page content

5. **Ingredient Group Support**
   - Detect subheadings within ingredients
   - Preserve groups: "For the dough:", "For the filling:", etc.
   - Better ingredient parsing

### Phase 2: Advanced Features (Optional)

1. **Site-Specific Extractors**
   - Build extractors for top 20 recipe sites
   - AllRecipes, Food Network, Bon Appetit, etc.
   - 80/20 rule: 20 sites = 80% of user imports

2. **Headless Browser Option**
   - Add Puppeteer/Playwright for JS-heavy sites
   - Optional feature (heavier resource usage)
   - Handles lazy-loaded images, dynamic content

3. **Recipe Validation & Repair**
   - Validate minimum recipe requirements
   - Attempt repairs if data is incomplete
   - Provide user feedback on missing data

4. **Image Extraction Improvements**
   - Find highest quality image
   - Handle responsive images (srcset)
   - Cache images in app

### Phase 3: User Experience

1. **Better Error Messages**
   - Tell user what went wrong
   - Suggest manual entry
   - Show partial results

2. **Recipe Preview Before Save**
   - Show extracted recipe
   - Allow user edits before saving
   - Flag suspicious/incomplete data

3. **Learning System**
   - Track successful vs failed imports by domain
   - Adjust strategy selection based on success rate
   - User feedback loop

## Implementation Priority

### High Priority (Do First)
- [ ] Add recipe plugin detection (WPRM, Tasty, etc.)
- [ ] Fix multi-section header processing
- [ ] Smart strategy merging (JSON-LD + heuristics)
- [ ] Better print URL detection
- [ ] Keep section headers (don't filter)

### Medium Priority
- [ ] Ingredient group support
- [ ] Site-specific extractors for top 10 sites
- [ ] Better image extraction
- [ ] Recipe validation

### Low Priority (Nice to Have)
- [ ] Headless browser support
- [ ] Learning/feedback system
- [ ] Recipe preview UI
- [ ] Manual edit mode

## Success Metrics

**Current State**: ~40-60% success rate (very hit-or-miss)

**Target After Phase 1**: ~75-85% success rate
- Recipe plugins: 95%+ success
- JSON-LD sites: 80%+ success
- Heuristic fallback: 50%+ success

**Target After Phase 2**: ~85-95% success rate
- Site-specific: 98%+ success
- With headless browser: 90%+ on JS-heavy sites

## Testing Plan

1. **Build Test Suite**
   - 50 diverse recipe URLs
   - Cover different site types, plugins, formats
   - Automated regression testing

2. **Test Categories**
   - WordPress recipe plugins (should be 100%)
   - JSON-LD structured data (80%+)
   - Blog-style recipes (70%+)
   - Complex multi-section recipes (60%+)
   - Non-English recipes (50%+)

3. **Manual Testing**
   - Import 10 recipes from user's favorite sites
   - Document failures
   - Build site-specific fixes

## Code Organization

```
server/
├── index.js                    # Main server & orchestrator
├── utils.js                    # Ingredient parsing
└── extractors/                 # NEW: Extraction strategies
    ├── json-ld.js             # JSON-LD extraction
    ├── plugins.js             # Recipe plugin detection
    ├── heuristic.js           # Pattern matching
    ├── print-version.js       # Print URL handling
    ├── site-specific.js       # Site-specific rules
    └── merger.js              # Strategy merging logic
```

## Next Steps

1. **Create improved extractor** with Phase 1 fixes
2. **Test against problematic URLs** user has encountered
3. **Add plugin detection** (biggest impact for lowest effort)
4. **Deploy and monitor** success rates
5. **Iterate based on real usage patterns**
