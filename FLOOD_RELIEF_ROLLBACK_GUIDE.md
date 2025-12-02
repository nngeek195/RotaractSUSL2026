# 🇱🇰 Flood Relief System - Rollback Guide

## Overview
This document details all changes made to implement the temporary flood relief system for December 2025. Use this guide to remove/rollback all relief-related features after the disaster relief campaign ends.

**Created:** December 2, 2025  
**Purpose:** Temporary disaster relief for Sri Lanka floods  
**Status:** Active

---

## Files Created (DELETE THESE)

### 1. Relief Request Pages
- `app/relief-request/page.jsx` - Material request submission with token generation
- `app/manage-relief/page.jsx` - Token-based request status management
- `app/relief-requests/page.jsx` - Public listing with filters, donation forms, and tracking

### 2. Admin Pages
- `app/admin/relief-management/page.jsx` - Admin dashboard for material requests (OLD - replaced by combined view)
- `app/admin/donation-offers/page.jsx` - Admin management of donation offers (OLD - replaced by combined view)
- `app/admin/relief/page.jsx` - **NEW: Combined tabbed interface for both requests and donations**

### 3. Documentation
- `FLOOD_RELIEF_ROLLBACK_GUIDE.md` - This file (can be deleted after rollback)

---

## Files Modified (RESTORE THESE)

### 1. Navigation Components

#### `app/components/Navbar.jsx`
**Changes Made:**
- Changed from `absolute` to `sticky` to `relative` positioning
- Added background and shadow for separation
- Added "🇱🇰 Relief" navigation link in both desktop and mobile menus

**Original State:**
```jsx
// Line ~16
<nav className="absolute top-0 left-0 right-0 z-50 px-4 lg:px-8 py-5">

// Desktop menu (line ~27-33) - NO relief link
<NavLink href="/" label="Home" active={currentPage === 'home'} />
<NavLink href="/about" label="About" active={currentPage === 'about'} />
<NavLink href="/projects" label="Projects" active={currentPage === 'projects'} />
<NavLink href="/gallery" label="Gallery" active={currentPage === 'gallery'} />
<NavLink href="/leadership" label="Leadership" active={currentPage === 'leadership'} />
<NavLink href="/join" label="Join Us" active={currentPage === 'join'} />

// Mobile menu (line ~87-93) - NO relief link
<MobileNavLink href="/" label="Home" active={currentPage === 'home'} onClick={closeMenu} />
<MobileNavLink href="/about" label="About" active={currentPage === 'about'} onClick={closeMenu} />
<MobileNavLink href="/projects" label="Projects" active={currentPage === 'projects'} onClick={closeMenu} />
<MobileNavLink href="/gallery" label="Gallery" active={currentPage === 'gallery'} onClick={closeMenu} />
<MobileNavLink href="/leadership" label="Leadership" active={currentPage === 'leadership'} onClick={closeMenu} />
<MobileNavLink href="/join" label="Join Us" active={currentPage === 'join'} onClick={closeMenu} />
```

**Current State (with relief):**
```jsx
// Line ~16
<nav className="relative z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm px-4 lg:px-8 py-4">

// Desktop menu - HAS relief link
<NavLink href="/" label="Home" active={currentPage === 'home'} />
<NavLink href="/about" label="About" active={currentPage === 'about'} />
<NavLink href="/projects" label="Projects" active={currentPage === 'projects'} />
<NavLink href="/relief-requests" label="🇱🇰 Relief" active={currentPage === 'relief'} />
<NavLink href="/gallery" label="Gallery" active={currentPage === 'gallery'} />
<NavLink href="/leadership" label="Leadership" active={currentPage === 'leadership'} />
<NavLink href="/join" label="Join Us" active={currentPage === 'join'} />

// Mobile menu - HAS relief link
<MobileNavLink href="/" label="Home" active={currentPage === 'home'} onClick={closeMenu} />
<MobileNavLink href="/about" label="About" active={currentPage === 'about'} onClick={closeMenu} />
<MobileNavLink href="/projects" label="Projects" active={currentPage === 'projects'} onClick={closeMenu} />
<MobileNavLink href="/relief-requests" label="🇱🇰 Relief" active={currentPage === 'relief-requests'} onClick={closeMenu} />
<MobileNavLink href="/gallery" label="Gallery" active={currentPage === 'gallery'} onClick={closeMenu} />
<MobileNavLink href="/leadership" label="Leadership" active={currentPage === 'leadership'} onClick={closeMenu} />
<MobileNavLink href="/join" label="Join Us" active={currentPage === 'join'} onClick={closeMenu} />
```

**Rollback Actions:**
1. Remove the relief link from desktop menu (line with `label="🇱🇰 Relief"`)
2. Remove the relief link from mobile menu
3. Optionally revert navbar styling to `absolute top-0 left-0 right-0 z-50 px-4 lg:px-8 py-5` if desired
4. Remove `bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm` if reverting to absolute

---

### 2. Homepage

#### `app/page.tsx`
**Changes Made:**
- Added emergency relief banner section with real-time stats
- Removed extra top padding from hero section
- Added relief stats state and Firestore listener

**Lines Modified:**
- **Line ~30-36:** Added relief stats state
```tsx
// ADDED - DELETE THIS
const [reliefStats, setReliefStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    assignedRequests: 0,
    fulfilledRequests: 0
});
```

- **Line ~77-90:** Added relief stats Firestore listener
```tsx
// ADDED - DELETE THIS ENTIRE useEffect
useEffect(() => {
    const q = query(collection(db, "materialRequests"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => doc.data());
      setReliefStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        assignedRequests: requests.filter(r => r.status === 'assigned').length,
        fulfilledRequests: requests.filter(r => r.status === 'fulfilled').length
      });
    });
    return () => unsubscribe();
}, []);
```

- **Line ~195-370 (approx):** Added entire emergency banner section
```tsx
{/* Flood Relief Emergency Banner Section */}
<section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-16 px-4 relative overflow-hidden">
  {/* ... entire banner with stats, buttons, visual items ... */}
</section>
```

**Rollback Actions:**
1. Delete the `reliefStats` state declaration
2. Delete the relief stats `useEffect` hook
3. Delete the entire `<section>` with "Flood Relief Emergency Banner"
4. The hero section should remain with `pt-24` (check if it's currently different)

---

### 3. Admin Panel

#### `app/admin/layout.tsx`
**Changes Made:**
- Combined "Relief Management" and "Donation Offers" menu items into single "🇱🇰 Flood Relief" link
- Updated href from `/admin/relief-management` to `/admin/relief`

**Original State (lines ~140-156):**
```tsx
<li>
  <Link
    href="/admin/relief-management"
    onClick={() => setIsSidebarOpen(false)}
    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-pink-400 transition"
  >
    <Heart size={20} /> Relief Management
  </Link>
</li>
<li>
  <Link
    href="/admin/donation-offers"
    onClick={() => setIsSidebarOpen(false)}
    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-pink-400 transition"
  >
    <Gift size={20} /> Donation Offers
  </Link>
</li>
```

**Current State:**
```tsx
<li>
  <Link
    href="/admin/relief"
    onClick={() => setIsSidebarOpen(false)}
    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 hover:text-pink-400 transition"
  >
    <Heart size={20} /> 🇱🇰 Flood Relief
  </Link>
</li>
```

**Rollback Actions:**
1. Delete the entire `<li>` block with "🇱🇰 Flood Relief"
2. Optionally restore the two original menu items (Relief Management & Donation Offers) if you want to keep those pages for reference

---

### 4. Email API

#### `app/api/send-email/route.js`
**Changes Made:**
- Added new email template: `relief_token`
- Blue gradient design with token display, request details, materials list

**Location:** Approximately line ~200-350 (before the final `else` block)

**Added Code Block:**
```javascript
else if (template === 'relief_token') {
    const { schoolName, district, contactPerson, contactNumber, description, items, token, trackUrl } = data;
    
    subject = `🇱🇰 Flood Relief Request Confirmation - ${schoolName}`;
    
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relief Request Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <!-- ENTIRE EMAIL TEMPLATE HTML -->
      </body>
      </html>
    `;
}
```

**Rollback Actions:**
1. Find and delete the entire `else if (template === 'relief_token')` block
2. Make sure the final `else` block for unknown templates remains intact

---

## Firestore Collections Created (OPTIONAL CLEANUP)

### Collections to Review/Delete:

1. **`materialRequests`** - Material request submissions
   - Fields: schoolName, district, address, contactPerson, contactNumber, email, description, items[], requestToken, status, createdAt, updatedAt
   - Delete entire collection when campaign ends

2. **`donationOffers`** - Donation offer submissions
   - Fields: donorName, contactNumber, email, itemsOffered, district, message, status, createdAt, updatedAt
   - Delete entire collection when campaign ends

### Firestore Security Rules to Remove:

```javascript
// REMOVE THESE RULES FROM firestore.rules

match /materialRequests/{requestId} {
  allow read: if true; // Public read access
  allow create: if true; // Public create access
  allow update, delete: if request.auth != null; // Authenticated users only
}

match /donationOffers/{offerId} {
  allow create: if true; // Anyone can submit offers
  allow read, update, delete: if request.auth != null; // Authenticated users only
}
```

---

## Step-by-Step Rollback Process

### Phase 1: Remove Navigation Links
1. Open `app/components/Navbar.jsx`
2. Remove `<NavLink href="/relief-requests" label="🇱🇰 Relief" ... />` from desktop menu
3. Remove `<MobileNavLink href="/relief-requests" label="🇱🇰 Relief" ... />` from mobile menu
4. Optionally revert navbar styling from `relative` back to `absolute` positioning
5. Save file

### Phase 2: Remove Homepage Banner
1. Open `app/page.tsx`
2. Delete `reliefStats` state (around line 30-36)
3. Delete relief stats `useEffect` hook (around line 77-90)
4. Delete entire emergency banner `<section>` (around line 195-370)
5. Verify hero section still has proper spacing (`pt-24`)
6. Save file

### Phase 3: Remove Admin Menu Items
1. Open `app/admin/layout.tsx`
2. Delete the "🇱🇰 Flood Relief" menu item (around line 140-150)
3. Optionally restore original two menu items if needed for reference
4. Save file

### Phase 4: Remove Email Template
1. Open `app/api/send-email/route.js`
2. Find the `relief_token` template block (around line 200-350)
3. Delete the entire `else if (template === 'relief_token') { ... }` block
4. Verify the final `else` block remains
5. Save file

### Phase 5: Delete Relief Pages
1. Delete folder: `app/relief-request/`
2. Delete folder: `app/manage-relief/`
3. Delete folder: `app/relief-requests/`
4. Delete folder: `app/admin/relief-management/` (old version)
5. Delete folder: `app/admin/donation-offers/` (old version)
6. Delete folder: `app/admin/relief/` (new combined version)

### Phase 6: Clean Firestore (OPTIONAL)
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Delete collection: `materialRequests`
4. Delete collection: `donationOffers`
5. Update Firestore security rules to remove relief-related rules

### Phase 7: Final Cleanup
1. Delete this rollback guide: `FLOOD_RELIEF_ROLLBACK_GUIDE.md`
2. Test the website to ensure:
   - No relief links in navigation
   - Homepage shows normally without banner
   - Admin panel has no relief-related items
   - No broken links or console errors
3. Commit changes with message: "Remove temporary flood relief system"

---

## Quick Reference - All Relief-Related Routes

**Public Pages:**
- `/relief-requests` - Main relief requests listing (DELETE)
- `/relief-request` - Submit material request (DELETE)
- `/manage-relief` - Token-based request management (DELETE)

**Admin Pages:**
- `/admin/relief-management` - OLD admin requests view (DELETE)
- `/admin/donation-offers` - OLD admin donations view (DELETE)
- `/admin/relief` - NEW combined admin view (DELETE)

---

## Testing After Rollback

1. **Navigation Test:**
   - Verify no "🇱🇰 Relief" link in navbar (desktop/mobile)
   - All other navigation links work correctly

2. **Homepage Test:**
   - No emergency banner visible
   - Hero section displays properly
   - No console errors about reliefStats

3. **Admin Panel Test:**
   - No relief-related menu items
   - All other admin pages work correctly

4. **Database Test:**
   - Firestore collections deleted (if Phase 6 completed)
   - No orphaned data

5. **404 Test:**
   - `/relief-requests` returns 404
   - `/relief-request` returns 404
   - `/manage-relief` returns 404
   - `/admin/relief` returns 404

---

## Backup Recommendation

Before performing rollback, create a backup:

```bash
# Git commit current state
git add .
git commit -m "Backup before removing flood relief system"
git tag flood-relief-backup-2025-12

# Or create a new branch
git checkout -b flood-relief-archive
git checkout main
```

---

## Notes

- The relief system was designed to be easily removable
- All relief features are isolated in separate files/components
- No core functionality was modified (only additions)
- Email template can remain without causing issues if forgotten
- Firestore data can be archived instead of deleted for records

---

## Contact

If issues arise during rollback, check:
1. Console for JavaScript errors
2. Network tab for failed API calls
3. Firestore rules for conflicts
4. Build errors in terminal

**Last Updated:** December 2, 2025
