# Server Storage Implementation

## Overview
The Crumb Recipe PWA now uses **server-side storage with PostgreSQL** as the primary data store, with **IndexedDB as an offline cache**. This enables multi-device sync and offline functionality.

## Architecture

### Three-Tier Storage
1. **Server (PostgreSQL)** - Primary storage (port 5432 via `postgres` container)
2. **API Layer (Express)** - REST endpoints (port 5554)
3. **Browser Cache (IndexedDB)** - Offline fallback

### Data Flow
```
Import/Create → Server API → PostgreSQL → IndexedDB Cache
                    ↓
                If offline → IndexedDB only (auto-sync when back online)
```

## Database Schema

### `recipes` table
- `id` (VARCHAR, PK) - Unique recipe ID (nanoid)
- `title` (TEXT) - Recipe name
- `image` (TEXT) - Image URL
- `author` (TEXT) - Recipe author
- `source_name` (TEXT) - Source website name
- `source_url` (TEXT) - Original recipe URL
- `yield` (TEXT) - Recipe yield/servings text
- `servings` (INT) - Numeric servings
- `times` (JSONB) - Prep/cook/total times
- `ingredients` (JSONB) - Ingredient list with sections
- `steps` (JSONB) - Instruction steps with sections
- `tips` (JSONB) - Tips array
- `notes` (TEXT) - User notes
- `nutrition` (JSONB) - Nutrition info (calories, protein, fat, carbs, etc.)
- `created_at` (BIGINT) - Creation timestamp
- `updated_at` (BIGINT) - Last update timestamp

### `cook_sessions` table
- `recipe_id` (VARCHAR, PK) - Recipe ID
- `checked_ingredients` (JSONB) - Checked ingredient indices
- `checked_steps` (JSONB) - Checked step indices
- `multiplier` (REAL) - Recipe multiplier (default: 1.0)
- `expires_at` (BIGINT) - Session expiration timestamp

### `settings` table
- `key` (TEXT, PK) - Setting key
- `value` (JSONB) - Setting value
- `updated_at` (BIGINT) - Last update timestamp

## API Endpoints

### Health Check
```
GET /health
Response: {"status": "ok", "timestamp": "..."}
```

### Get All Recipes
```
GET /api/recipes
Response: {"success": true, "recipes": [...]}
```

### Get Single Recipe
```
GET /api/recipes/:id
Response: {"success": true, "recipe": {...}}
```

### Save Recipe
```
POST /api/recipes
Body: Recipe object
Response: {"success": true, "recipe": {...}}
```

### Update Recipe
```
PUT /api/recipes/:id
Body: Partial Recipe object
Response: {"success": true, "recipe": {...}}
```

### Delete Recipe
```
DELETE /api/recipes/:id
Response: {"success": true}
```

### Import Recipe
```
POST /api/import
Body: {
  "url": "https://example.com/recipe",
  "useImprovedExtractor": true,  // default
  "saveToServer": true            // default
}
Response: {"success": true, "recipe": {...}}
```

## Frontend Implementation

### Hybrid Storage Layer (`src/db.ts`)
The `CrumbDB` class provides a transparent server-first API:

```typescript
// All operations try server first, fall back to IndexedDB
await db.getAllRecipes()        // Server → Cache
await db.getRecipe(id)           // Server → Cache
await db.saveRecipe(recipe)      // Server + Cache
await db.updateRecipe(id, data)  // Server + Cache
await db.deleteRecipe(id)        // Server + Cache
await db.importRecipe(url)       // Server + Cache
```

### Offline Behavior
- **Online**: Server API is used, IndexedDB synced in background
- **Offline**: IndexedDB cache serves requests automatically
- **Reconnect**: Next API call auto-syncs changes

### State Management (`src/state/session.ts`)
- `useRecipeStore` - Uses hybrid db methods for all recipe operations
- `useCookSession` - Still uses local IndexedDB for session state
- `useSettings` - Uses Zustand persist (localStorage)

## Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://appuser:password@postgres:5432/app_db
PORT=5554
NODE_ENV=production
```

### Docker Compose
```yaml
crumb-recipe:
  depends_on:
    postgres:
      condition: service_healthy
  environment:
    - DATABASE_URL=${DATABASE_URL}
```

### Database Initialization
The database schema is automatically created on server startup via `initDatabase()`:

```javascript
// server/index.js
(async () => {
  await initDatabase();  // Creates tables if they don't exist
  app.listen(PORT);
})();
```

## Multi-Device Sync

### How It Works
1. **Device A** imports a recipe → Saved to server
2. **Device B** opens app → Fetches all recipes from server
3. **Both devices** cache recipes locally for offline use
4. **Any device** can edit/delete → Changes sync to server + all devices

### Cache Synchronization
- Fresh load: `getAllRecipes()` fetches from server, updates cache
- View recipe: `getRecipe(id)` fetches latest, updates cache
- Background sync: Cache is updated after every successful server operation

## Migration Notes

### From Pure IndexedDB to Hybrid
**No data migration needed!** Existing IndexedDB data remains in browser cache. To sync to server:

1. Open app (loads existing cache)
2. Click "Export Recipes" in Settings → Download JSON
3. Clear cache (optional)
4. Click "Import Recipes" → Upload JSON
5. All recipes will be saved to server

### Data Persistence
- **Server data**: Persists across devices and browser cache clears
- **Cache data**: Persists until browser storage is cleared
- **Sessions**: Still local-only (expire after 72 hours)

## Backup & Restore

### Export (Settings Page)
Downloads all recipes as JSON from server:
```json
{
  "recipes": [...],
  "exportedAt": 1234567890,
  "version": "1.0.0"
}
```

### Import (Settings Page)
Uploads JSON file, saves all recipes to server:
- Existing recipes (by ID) are updated
- New recipes are created

### Clear All Data
⚠️ **WARNING**: Deletes ALL recipes from server AND local cache!

## Troubleshooting

### Server Connection Issues
Check browser console:
- `✓ Server connection established` - Online mode active
- `⚠ Server unavailable - using offline cache` - Offline mode active

### Database Connection
```bash
# Check server logs
docker compose logs crumb-recipe

# Expected output:
# ✓ Database schema initialized successfully
# ✓ Database initialized
# Recipe import server running on port 5554
```

### API Testing
```bash
# Health check
curl http://localhost:5554/health

# Get recipes
curl http://localhost:5554/api/recipes

# Import recipe
curl -X POST http://localhost:5554/api/import \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/recipe"}'
```

## Performance

### Database Indexes
Optimized queries with indexes on:
- `created_at` - Fast chronological sorting
- `title` - Recipe search
- `source_url` - Duplicate detection

### Caching Strategy
- **First load**: Server request + cache update (~500ms)
- **Cached load**: Instant from IndexedDB (~10ms)
- **Offline load**: Instant from cache (~10ms)
- **Background sync**: Non-blocking updates

## Future Enhancements

### Potential Additions
- [ ] Real-time sync via WebSockets
- [ ] Conflict resolution for simultaneous edits
- [ ] Server-side session storage (sync cooking state)
- [ ] User authentication & private recipes
- [ ] Recipe sharing via public URLs
- [ ] Incremental sync (only changed recipes)
- [ ] Compression for large recipe collections

### Current Limitations
- Sessions are device-local only
- No user accounts (all recipes shared across app users)
- No conflict detection for simultaneous edits
- Full recipe sync on each load (no delta updates)

## Related Files

### Server
- `server/db.js` - Database connection & schema
- `server/index.js` - API endpoints & server setup

### Frontend
- `src/api/recipes.ts` - API client methods
- `src/db.ts` - Hybrid storage wrapper
- `src/state/session.ts` - Recipe & session stores
- `src/types.ts` - TypeScript interfaces

### Documentation
- `ARCHITECTURE.md` - Complete system architecture
- `IMPROVEMENTS.md` - Scraping enhancements
- `NUTRITION.md` - Nutrition feature details
- `QUICK_START.md` - Development setup guide

## Summary

✅ **Multi-device sync enabled** - Recipes sync across all devices  
✅ **Offline support** - Full functionality without internet  
✅ **Automatic failover** - Seamless server/cache switching  
✅ **Zero migration needed** - Works with existing data  
✅ **Production ready** - Deployed and tested  

Access the app at: **http://crumb.local** (or your configured domain)
