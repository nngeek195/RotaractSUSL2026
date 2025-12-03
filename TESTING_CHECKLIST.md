# Testing Checklist - Flood Relief System Redesign

## Pre-Testing Setup
- [ ] Ensure Firebase is connected and running
- [ ] Clear browser cache and cookies
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Have admin credentials ready

---

## 1. Request Form Testing

### Predefined Items Selection
- [ ] All 12 predefined items display with icons
- [ ] Items grouped correctly by category
- [ ] Grid layout responsive on mobile (1 column)
- [ ] Grid layout on tablet (2 columns)
- [ ] Grid layout on desktop (2-3 columns)
- [ ] Quantity input accepts numbers only
- [ ] Quantity input rejects negative numbers
- [ ] Quantity input rejects zero
- [ ] Can enter quantities for multiple items
- [ ] Can leave items blank (not needed)

### Form Validation
- [ ] Error if no school name entered
- [ ] Error if no district selected
- [ ] Error if no contact person entered
- [ ] Error if no contact number entered
- [ ] Error if no items selected (all quantities empty)
- [ ] Error if items selected but quantities are zero
- [ ] Success if at least one item has valid quantity
- [ ] Email field optional (can be left empty)

### Form Submission
- [ ] Loading state shows during submission
- [ ] Token generated in format: REL-XXXXX-XXXXX
- [ ] Token displayed in success modal
- [ ] Copy token button works
- [ ] Request saved to Firestore with correct structure
- [ ] Items saved with `id`, `name`, and `quantity` fields
- [ ] Status set to "pending"
- [ ] Timestamps (createdAt, updatedAt) created
- [ ] Form resets after successful submission

### Email Notifications
- [ ] If email provided, notification sent
- [ ] Email contains correct token
- [ ] Email contains school details
- [ ] Email contains selected items list
- [ ] Email contains track URL link
- [ ] Email sent confirmation shows in UI
- [ ] No error if email sending fails
- [ ] Request still saved even if email fails

---

## 2. Privacy & Contact Information

### Public Request Listing Page
- [ ] School name visible
- [ ] District visible
- [ ] Status badge visible
- [ ] Description visible (if provided)
- [ ] Items list visible
- [ ] **Contact person NAME hidden** ✓
- [ ] **Contact phone NUMBER hidden** ✓
- [ ] No User icon displayed
- [ ] No Phone icon displayed

### Request Detail Modal (Public)
- [ ] School name visible
- [ ] District visible
- [ ] Submitted date/time visible
- [ ] Address visible (if provided)
- [ ] Description visible (if provided)
- [ ] Full items list visible
- [ ] **Contact person NOT shown** ✓
- [ ] **Contact number NOT shown** ✓
- [ ] Blue privacy notice box displays
- [ ] Privacy notice explains admin-only access

### Admin Panel
- [ ] Can access `/admin/relief`
- [ ] **Contact person visible** ✓
- [ ] **Contact number visible** ✓
- [ ] Email visible (if provided)
- [ ] All fields editable
- [ ] Can update status
- [ ] Can delete request
- [ ] CSV export includes contact details

### Manage-Relief Page (Token Holder)
- [ ] Token holder can see their own request
- [ ] Contact person visible (own info)
- [ ] Contact number visible (own info)
- [ ] Can update status
- [ ] Can view submission date
- [ ] Can see all items requested

---

## 3. Statistics Dashboard

### Display & Layout
- [ ] Dashboard appears on `/relief-requests` page
- [ ] Located between header and filters section
- [ ] Shows "📊 Materials Overview" heading
- [ ] Description text displays
- [ ] Grid layout: 1 column mobile, 2 tablet, 3 desktop
- [ ] Only items with requests display
- [ ] Items without requests hidden

### Item Cards
- [ ] Each card shows item icon
- [ ] Each card shows item name
- [ ] Fulfillment percentage displayed (e.g., "67.5% fulfilled")
- [ ] Progress bar displays correctly
- [ ] Progress bar color is green gradient
- [ ] Progress bar width matches percentage
- [ ] Progress bar max width is 100%

### Statistics Accuracy
- [ ] **Total Requested** = sum of all quantities for that item
- [ ] **Total Fulfilled** = sum from requests with status="fulfilled"
- [ ] **Pending** = Requested - Fulfilled
- [ ] Percentages calculated correctly
- [ ] Real-time updates when new request added
- [ ] Real-time updates when status changed to fulfilled
- [ ] Works with old request format (backward compatible)

### Color Coding
- [ ] Requested stat: Blue background
- [ ] Fulfilled stat: Green background
- [ ] Pending stat: Yellow background
- [ ] Progress bar: Green gradient (green-400 to green-600)

---

## 4. Data Format & Compatibility

### New Format Requests
- [ ] Items saved with `id` field
- [ ] Items saved with `name` field
- [ ] Items saved with `quantity` as number (not string)
- [ ] Items array structure correct
- [ ] No duplicate items in same request

### Old Format Requests (Backward Compatibility)
- [ ] Old requests display in listing
- [ ] Old requests open in detail modal
- [ ] Old request items show in statistics (best effort)
- [ ] Statistics use fallback ID generation for old items
- [ ] No errors thrown for missing `id` field

### Mixed Data Scenarios
- [ ] Page loads with mix of old and new requests
- [ ] Statistics calculate correctly with mixed data
- [ ] Filters work with both formats
- [ ] Search works with both formats

---

## 5. User Flows

### Flow 1: Submit Request
1. [ ] Visit `/relief-requests`
2. [ ] Click "Request Donation" button
3. [ ] Fill school details (name, district, address, contact)
4. [ ] Enter optional email
5. [ ] Select 3-5 items with quantities
6. [ ] Submit form
7. [ ] See token in success modal
8. [ ] Copy token
9. [ ] Close modal
10. [ ] See new request in listing (may need refresh)

### Flow 2: Track Request
1. [ ] Visit `/relief-requests`
2. [ ] Click "Track My Request" button
3. [ ] Enter token in modal
4. [ ] Click verify
5. [ ] Redirected to `/manage-relief?token=XXX`
6. [ ] See full request details
7. [ ] Can update status

### Flow 3: View Statistics
1. [ ] Visit `/relief-requests`
2. [ ] Scroll to statistics dashboard
3. [ ] See item cards with progress bars
4. [ ] Verify percentages make sense
5. [ ] Check that only requested items show

### Flow 4: Admin Coordination
1. [ ] Login as admin
2. [ ] Visit `/admin/relief`
3. [ ] See Material Requests tab
4. [ ] Click on a request
5. [ ] See full contact details in modal
6. [ ] Update status to "assigned"
7. [ ] Close modal
8. [ ] Verify statistics updated

---

## 6. Edge Cases

### Empty States
- [ ] No requests exist: statistics dashboard hidden
- [ ] No items selected: shows "Please select at least one item"
- [ ] All items fulfilled: progress bars show 100%
- [ ] No fulfilled items: progress bars show 0%

### Large Numbers
- [ ] Quantity > 1000 displays correctly
- [ ] Statistics handle large totals (e.g., 10,000 notebooks)
- [ ] Percentage calculation accurate with large numbers
- [ ] No overflow in UI elements

### Special Characters
- [ ] School name with quotes/apostrophes works
- [ ] District with special chars works
- [ ] Description with emoji works
- [ ] Phone number with spaces/dashes works

### Network Issues
- [ ] Form shows loading state during submission
- [ ] Error message if submission fails
- [ ] Retry submission works
- [ ] Statistics dashboard shows loading state
- [ ] Graceful fallback if data fetch fails

---

## 7. Responsive Design

### Mobile (320px - 640px)
- [ ] Predefined items grid: 1 column
- [ ] Statistics dashboard: 1 column
- [ ] Request cards stack vertically
- [ ] Buttons are thumb-friendly (min 44px height)
- [ ] Text readable without zoom
- [ ] No horizontal scroll

### Tablet (641px - 1024px)
- [ ] Predefined items grid: 2 columns
- [ ] Statistics dashboard: 2 columns
- [ ] Request cards: 2 columns
- [ ] Proper spacing and padding

### Desktop (1025px+)
- [ ] Predefined items grid: 2 columns
- [ ] Statistics dashboard: 3 columns
- [ ] Request cards: 3 columns
- [ ] Max width container (7xl = 1280px)

---

## 8. Accessibility

### Keyboard Navigation
- [ ] Can tab through all form fields
- [ ] Can tab to each quantity input
- [ ] Submit button accessible via keyboard
- [ ] Modal close button accessible
- [ ] Focus visible on all interactive elements

### Screen Reader
- [ ] Form labels read correctly
- [ ] Status badges announced
- [ ] Progress bar percentages announced
- [ ] Privacy notice read aloud
- [ ] Error messages announced

### Color Contrast
- [ ] Text readable on all backgrounds
- [ ] Status badges have sufficient contrast
- [ ] Progress bars visible to colorblind users
- [ ] Icons supplement color coding

---

## 9. Performance

### Load Times
- [ ] Page loads in < 2 seconds
- [ ] Statistics calculate in < 500ms
- [ ] Form submission completes in < 3 seconds
- [ ] No visible lag when typing
- [ ] Real-time updates smooth (no flicker)

### Data Usage
- [ ] Only necessary data fetched
- [ ] Images optimized (icons are emoji, no images)
- [ ] No unnecessary re-renders
- [ ] Efficient Firestore queries

---

## 10. Integration Testing

### With Email Service (Resend)
- [ ] Email service connection works
- [ ] Template `relief_token` exists
- [ ] Token passed correctly
- [ ] Items list formatted in email
- [ ] Track URL clickable in email
- [ ] Unsubscribe link works

### With Firebase
- [ ] Firestore rules allow public read
- [ ] Firestore rules allow public create
- [ ] Firestore rules prevent unauthorized update
- [ ] Firestore rules prevent unauthorized delete
- [ ] Timestamps created automatically
- [ ] Data structure matches schema

### With Admin Panel
- [ ] Admin can see all requests
- [ ] Admin can filter by status
- [ ] Admin can filter by district
- [ ] Admin can search by school name
- [ ] Admin can update status
- [ ] Statistics update when admin changes status
- [ ] CSV export includes all fields

---

## 11. Security Testing

### Input Validation
- [ ] XSS attack prevented (script tags sanitized)
- [ ] SQL injection N/A (NoSQL database)
- [ ] Phone number validation (format check)
- [ ] Email validation (format check)
- [ ] Quantity validation (positive numbers only)

### Privacy Protection
- [ ] Contact info not in HTML source on public page
- [ ] Contact info not in API response to public
- [ ] Only admin can access contact details
- [ ] Token required to view own request
- [ ] Can't guess tokens (high entropy)

### Authentication
- [ ] Public can submit requests (no auth needed)
- [ ] Public can view listings (no auth needed)
- [ ] Public CANNOT update requests
- [ ] Public CANNOT delete requests
- [ ] Admin auth required for admin panel

---

## 12. Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Layout correct
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Layout correct
- [ ] No console errors

### Safari (Desktop)
- [ ] All features work
- [ ] Layout correct
- [ ] Date/time formatting correct

### Safari (iOS)
- [ ] Touch interactions work
- [ ] Number input keyboard shows
- [ ] Zoom disabled on inputs (if desired)
- [ ] No rendering issues

### Chrome (Android)
- [ ] Touch interactions work
- [ ] Material design respected
- [ ] No performance issues

---

## 13. Regression Testing

### Existing Features (Should Still Work)
- [ ] Donation offers submission
- [ ] Track request modal
- [ ] Filter by district
- [ ] Filter by status
- [ ] Search by school name
- [ ] Clear filters button
- [ ] Request detail modal
- [ ] Status badges color coding
- [ ] Homepage relief banner
- [ ] Homepage relief statistics

### Navigation
- [ ] Navbar "🇱🇰 Relief" link works
- [ ] Navbar on all pages
- [ ] Footer on all pages
- [ ] Back button works correctly
- [ ] Page refresh keeps filters

---

## 14. Documentation Review

### Code Documentation
- [ ] Comments explain complex logic
- [ ] Function names descriptive
- [ ] Variable names clear
- [ ] No TODO comments left

### User Documentation
- [ ] RELIEF_SYSTEM_REDESIGN_SUMMARY.md accurate
- [ ] RELIEF_VISUAL_CHANGES_GUIDE.md helpful
- [ ] FLOOD_RELIEF_ROLLBACK_GUIDE.md updated
- [ ] Screenshots/diagrams needed?

---

## Test Results Summary

**Date Tested**: _______________
**Tester**: _______________
**Browser**: _______________
**Device**: _______________

### Pass/Fail Counts:
- ✅ Passed: _____
- ❌ Failed: _____
- ⏭️ Skipped: _____

### Critical Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes:
_______________________________________________
_______________________________________________
_______________________________________________

---

## Sign-off

- [ ] All critical features tested and working
- [ ] No blocking bugs found
- [ ] Documentation complete
- [ ] Ready for production deployment

**Approved by**: _______________
**Date**: _______________
