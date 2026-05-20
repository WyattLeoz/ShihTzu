# Singapore Map Implementation

## Current Implementation ✅

Your map now displays **real Singapore maps** using OpenStreetMap via Leaflet library. The implementation is fully functional and shows:

- **Real Singapore geography** with streets, landmarks, and buildings
- **Incident markers** based on actual coordinates (or generated near Singapore if coordinates missing)
- **Hospital markers** at their real locations
- **Volunteer task markers** positioned around Singapore
- **Interactive popups** with detailed information for each marker

### Current Map Features:
- ✅ **Real Singapore map** (not fake/grid-based)
- ✅ **Interactive markers** with click-to-view details
- ✅ **Zoom controls** and navigation
- ✅ **Filter system** (incidents, hospitals, volunteers)
- ✅ **Severity filtering** for incidents
- ✅ **Free to use** (no API key required)

## Google Maps Alternative 🌍

If you prefer to use Google Maps instead of OpenStreetMap, here's how to set it up:

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Maps JavaScript API** and **Geocoding API**
4. Create credentials (API key)
5. Restrict the API key to your domain for security

### Step 2: Add API Key to Environment Variables

Update your `.env` file:
```bash
# Add this to your .env file
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Step 3: Install Google Maps Libraries

```bash
npm install @react-google-maps/api
```

### Step 4: Replace Map Implementation

The current implementation uses Leaflet + OpenStreetMap. To switch to Google Maps, you would need to:

1. Replace the `MapContainer` and `TileLayer` components with Google Maps equivalents
2. Update marker components to use Google Maps markers
3. Handle coordinate conversions if needed

### Pros and Cons:

**OpenStreetMap (Current):**
- ✅ Completely free
- ✅ No setup required
- ✅ Open data that can be customized
- ✅ Works immediately

**Google Maps:**
- ✅ More familiar interface for many users
- ✅ Real-time traffic and transit info
- ✅ Street View available
- ✅ Better routing capabilities
- ❌ Requires API key (costs money after free tier)
- ❌ Setup required
- ❌ Usage limits and billing

## Current Singapore Configuration

Your map is already centered on Singapore with these coordinates:
- **Latitude:** 1.3521
- **Longitude:** 103.8198
- **Default Zoom:** 12

## Testing the Current Implementation

1. Start the dev server: `npm run dev`
2. Navigate to the MapView in your responder portal
3. You should see a real map of Singapore
4. Click on markers to see detailed information
5. Use zoom controls to navigate

## Customizing Map Appearance

You can customize the map tiles by changing the `TileLayer` URL in `MapView.tsx`:

```typescript
// Current: OpenStreetMap standard tiles
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; OpenStreetMap contributors'
/>

// Alternative: CartoDB (cleaner, minimal style)
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
/>

// Alternative: Dark mode
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
/>
```

## Future Enhancements

Consider adding:
- **Real-time location updates** for responders
- **Geofencing** for automatic notifications
- **Route planning** between incidents and resources
- **Heat maps** for incident density
- **Offline caching** for poor connectivity areas

---

**Status:** ✅ Map implementation complete and functional!