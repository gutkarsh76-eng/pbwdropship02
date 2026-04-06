# Integration Guide - PBW Portal + Order Tracker

## Overview

This document outlines the changes made to integrate the PBW Order Tracker into the main PBW Dropshipper Portal.

## Changes Made

### 1. **File Structure**
- Created `/client/src/pages/tracker/` directory
- Added `TrackerHome.tsx` - The order tracker page from the tracker project
- All other files remain intact from the original project

### 2. **App.tsx Updates**
**Location**: `/client/src/App.tsx`

**Changes**:
```typescript
// Added import
import TrackerHome from "./pages/tracker/TrackerHome";

// Added new route
<Route path="/tracker" component={TrackerHome} />
```

**Purpose**: Makes the tracker accessible at `/tracker` route and opens in a new window.

### 3. **Landing.tsx Updates**
**Location**: `/client/src/pages/Landing.tsx`

**Changes**:
- Line 88: Header navigation button
  - From: `onClick={() => setLocation("/track")}`
  - To: `onClick={() => window.open("/tracker", "_blank")}`

- Line 119: Hero section button
  - From: `onClick={() => setLocation("/track")}`
  - To: `onClick={() => window.open("/tracker", "_blank")}`

- Line 249: Footer button
  - From: `onClick={() => setLocation("/track")}`
  - To: `onClick={() => window.open("/tracker", "_blank")}`

**Purpose**: All Track Order buttons now open the tracker in a new window.

### 4. **DashboardLayout.tsx Updates**
**Location**: `/client/src/components/DashboardLayout.tsx`

**Changes**:
- Line 42: Agent menu item
  - From: `{ icon: Truck, label: "Track Order", path: "/track" }`
  - To: `{ icon: Truck, label: "Track Order", path: "/tracker", external: true }`

- Line 50: Admin menu item
  - From: `{ icon: Truck, label: "Track Order", path: "/track" }`
  - To: `{ icon: Truck, label: "Track Order", path: "/tracker", external: true }`

- Lines 167-182: Menu rendering logic
  - Added check for `item.external` property
  - External links use `window.open(item.path, "_blank")`
  - Internal links use `setLocation(item.path)`

**Purpose**: Dashboard sidebar Track Order buttons now open in a new window.

## Styling Consistency

Both the main website and tracker use:
- **Same Tailwind CSS configuration**
- **Same component library** (Radix UI + custom components)
- **Same color scheme** (primary, secondary, accent colors)
- **Same typography** (fonts and sizes)
- **Same spacing and layout patterns**

## Testing Checklist

- [ ] Landing page loads correctly
- [ ] All Track Order buttons open tracker in new window
- [ ] Dashboard navigation works for agents
- [ ] Dashboard navigation works for admins
- [ ] Tracker page loads and functions correctly
- [ ] Styling is consistent across both pages
- [ ] Mobile responsiveness works
- [ ] No console errors

## Browser Compatibility

The integration uses standard web APIs:
- `window.open()` - Supported in all modern browsers
- React Router (wouter) - Works across all major browsers
- Tailwind CSS - No browser-specific issues

## Backward Compatibility

- Original `/track` route is preserved
- All existing functionality remains intact
- New `/tracker` route is additive only
- No breaking changes to existing components

## Deployment Notes

1. **Environment Variables**: Ensure all required `.env` variables are set
2. **Dependencies**: Run `pnpm install` to ensure all packages are installed
3. **Build**: Run `pnpm build` to create production bundle
4. **Testing**: Run `pnpm dev` to test locally before deployment

## Future Enhancements

Potential improvements:
1. Add close button to tracker when opened in new window
2. Implement tracker analytics
3. Add tracker customization options
4. Implement tracker embedding for external sites
5. Add tracker notification system

## Support

For issues or questions about the integration:
1. Check the README.md for general setup
2. Review the original project documentation
3. Check browser console for error messages
4. Verify all environment variables are set correctly

---

**Integration Date**: April 4, 2026  
**Integration Version**: 1.0.0
