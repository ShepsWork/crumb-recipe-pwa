#!/bin/bash

# Test script for all known recipe URLs

API_URL="http://localhost:5554/api/import"

echo "🧪 Testing Recipe Scraper with All Known URLs"
echo "=============================================="
echo ""

# Array of test URLs
declare -a urls=(
  # Cooked Plugin - Print version
  "https://thebakingnetwork.com/recipes/pumpkin-sourdough-drop-donuts/?print=1"
  
  # Cooked Plugin - Regular
  "https://thebakingnetwork.com/recipes/pumpkin-sourdough-drop-donuts/"
  
  # WPRM Plugin examples
  "https://www.kitchensanctuary.com/wprm_print/air-fryer-donut-holes-recipe"
  "https://www.acouplecooks.com/margherita-flatbread-pizza/"
  
  # Tasty Recipes examples
  "https://sallysbakingaddiction.com/chocolate-chip-cookies/"
  
  # JSON-LD heavy sites
  "https://www.bonappetit.com/recipe/bas-best-chocolate-chip-cookies"
  
  # AllRecipes (JSON-LD)
  "https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/"
)

test_count=0
success_count=0
failed_urls=()

for url in "${urls[@]}"; do
  test_count=$((test_count + 1))
  echo "[$test_count] Testing: $url"
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$url\"}" 2>/dev/null)
  
  success=$(echo "$response" | jq -r '.success // false')
  
  if [ "$success" = "true" ]; then
    title=$(echo "$response" | jq -r '.recipe.title // "No title"')
    ing_count=$(echo "$response" | jq '.recipe.ingredients | length')
    step_count=$(echo "$response" | jq '.recipe.steps | length')
    has_headers=$(echo "$response" | jq '[.recipe.ingredients[] | select(.isGroupHeader == true)] | length')
    
    echo "   ✅ SUCCESS: $title"
    echo "      📊 $ing_count ingredients, $step_count steps"
    if [ "$has_headers" -gt 0 ]; then
      echo "      🏷️  $has_headers section headers found"
    fi
    success_count=$((success_count + 1))
  else
    error=$(echo "$response" | jq -r '.error // "Unknown error"')
    echo "   ❌ FAILED: $error"
    failed_urls+=("$url")
  fi
  echo ""
done

echo "=============================================="
echo "📈 Test Results: $success_count/$test_count succeeded"
echo ""

if [ ${#failed_urls[@]} -gt 0 ]; then
  echo "❌ Failed URLs:"
  for url in "${failed_urls[@]}"; do
    echo "   - $url"
  done
fi
