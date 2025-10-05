/**
 * Recipe Import Test Suite
 * 
 * Tests the improved extractor against various recipe sites
 */

import { extractRecipeImproved } from './extractors/improved-extractor.js';

const testUrls = [
  // WordPress Recipe Maker (WPRM) sites - should be 95%+ success
  {
    url: 'https://www.pantrymama.com/sourdough-cinnamon-roll-focaccia-bread/',
    name: 'Pantry Mama - WPRM Plugin',
    expectedPlugin: 'WPRM'
  },
  
  // Multi-section recipes - tests multi-header processing
  {
    url: 'https://www.theclevercarrot.com/2020/05/homemade-fluffy-sourdough-pancakes/',
    name: 'The Clever Carrot - Multi-section',
    expectSections: true
  },
  
  // Add more test URLs here
];

async function runTests() {
  console.log('='.repeat(70));
  console.log('CRUMB RECIPE IMPORT TEST SUITE');
  console.log('='.repeat(70));
  console.log('');
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const test of testUrls) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`URL: ${test.url}`);
    console.log('-'.repeat(70));
    
    try {
      const startTime = Date.now();
      const recipe = await extractRecipeImproved(test.url);
      const duration = Date.now() - startTime;
      
      // Validate results
      const checks = {
        hasTitle: !!recipe.title,
        hasIngredients: recipe.ingredients?.length >= 3,
        hasSteps: recipe.steps?.length >= 3,
        hasImage: !!recipe.image,
        hasSourceUrl: !!recipe.sourceUrl,
        avgStepLength: recipe.steps?.reduce((sum, s) => sum + s.length, 0) / (recipe.steps?.length || 1)
      };
      
      const allPassed = checks.hasTitle && checks.hasIngredients && checks.hasSteps;
      
      if (allPassed) {
        passed++;
        console.log('✅ PASSED');
      } else {
        failed++;
        console.log('❌ FAILED');
      }
      
      // Display results
      console.log(`\n📊 Results (${duration}ms):`);
      console.log(`   Title: ${recipe.title?.substring(0, 50)}${recipe.title?.length > 50 ? '...' : ''}`);
      console.log(`   Ingredients: ${recipe.ingredients?.length || 0} ${checks.hasIngredients ? '✓' : '✗'}`);
      console.log(`   Steps: ${recipe.steps?.length || 0} ${checks.hasSteps ? '✓' : '✗'}`);
      console.log(`   Avg step length: ${checks.avgStepLength.toFixed(1)} chars`);
      console.log(`   Image: ${checks.hasImage ? '✓' : '✗'}`);
      console.log(`   Author: ${recipe.author || 'N/A'}`);
      
      if (recipe.times) {
        console.log(`   Times: Prep ${recipe.times.prep || 0}m, Cook ${recipe.times.cook || 0}m`);
      }
      
      // Check for section headers
      const hasSectionHeaders = recipe.steps?.some(s => /^\*\*.+:\*\*$/.test(s));
      if (test.expectSections && hasSectionHeaders) {
        console.log(`   Section headers: ✓ (multi-section recipe)`);
      }
      
      // Show first few ingredients and steps
      console.log('\n   First 3 ingredients:');
      recipe.ingredients?.slice(0, 3).forEach((ing, i) => {
        console.log(`   ${i + 1}. ${ing.raw?.substring(0, 60)}`);
      });
      
      console.log('\n   First 3 steps:');
      recipe.steps?.slice(0, 3).forEach((step, i) => {
        const display = step.substring(0, 80) + (step.length > 80 ? '...' : '');
        console.log(`   ${i + 1}. ${display}`);
      });
      
      results.push({
        name: test.name,
        url: test.url,
        success: allPassed,
        duration,
        ...checks
      });
      
    } catch (error) {
      failed++;
      console.log('❌ ERROR');
      console.log(`   ${error.message}`);
      
      results.push({
        name: test.name,
        url: test.url,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total tests: ${testUrls.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success rate: ${((passed / testUrls.length) * 100).toFixed(1)}%`);
  console.log('');
  
  // Detailed results table
  console.log('\nDetailed Results:');
  console.log('-'.repeat(70));
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const time = r.duration ? `${r.duration}ms` : 'ERROR';
    console.log(`${status} ${r.name.padEnd(40)} ${time.padStart(10)}`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });
  
  console.log('');
}

// Run tests
runTests().catch(console.error);
