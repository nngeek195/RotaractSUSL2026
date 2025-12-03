# Quick Start: Managing Relief Items

## 🎯 For Administrators

This guide shows you how to manage relief items (notebooks, pens, bags, etc.) that appear in the flood relief request form.

---

## 📍 Where to Manage Items

1. Login to admin panel
2. Look in left sidebar for: **🎁 Relief Items**
3. Click to open the relief items management page

---

## ➕ Adding a New Item

### Step-by-Step:

1. Click the **"Add New Item"** button (top right)

2. Fill in the form:
   ```
   Item ID:         markers        (lowercase, no spaces)
   Name (English):  Markers        (what users will see)
   Name (Sinhala):  මාකර්ස්        (optional)
   Icon:            🖍️             (pick an emoji)
   Category:        Stationery     (from dropdown)
   Sort Order:      13             (where it appears in list)
   ```

3. Click **"Add Item"**

4. Done! The item now appears in the request form immediately.

---

## ✏️ Editing an Existing Item

1. Find the item in the table
2. Click the **blue Edit button** (pencil icon)
3. Fields become editable
4. Make your changes
5. Click **green Save button** (checkmark icon)
6. Or click **gray Cancel button** to discard changes

**You can change**:
- Display name (English/Sinhala)
- Icon (emoji)
- Category
- Sort order

**⚠️ Careful with ID**:
- Changing ID may affect existing requests
- Best to leave it unchanged

---

## 🗑️ Deleting an Item

1. Find the item in the table
2. Click the **red Delete button** (trash icon)
3. Confirm deletion in popup
4. Item removed immediately

**⚠️ Warning**:
- Existing requests with this item will still show it
- New requests won't see this item
- Consider carefully before deleting

---

## 📊 Sort Order Explained

**Sort Order** controls where the item appears in the request form.

**Examples**:
- `1` = First item (top of list)
- `5` = Fifth item
- `12` = Twelfth item (bottom)

**Tips**:
- Lower numbers appear first
- You can have gaps (1, 5, 10, 15...)
- To move an item up: decrease its number
- To move an item down: increase its number

---

## 🎨 Icon Guide

**How to add emoji icons**:

**Windows**:
- Press `Win + .` (Windows key + period)
- Browse emoji picker
- Click emoji to insert

**Mac**:
- Press `Cmd + Ctrl + Space`
- Browse emoji picker
- Click emoji to insert

**Popular icons for relief items**:
```
📓 Notebooks        🖊️ Pens           ✏️ Pencils
📚 Books            📏 Rulers          🧹 Erasers
🎒 Bags             💧 Water           🍱 Lunch
👞 Shoes            👔 Uniforms        ☂️ Umbrellas
🖍️ Crayons         📐 Geometry Set    🧺 Baskets
🧴 Sanitizer        😷 Masks           🩹 First Aid
```

---

## 📁 Categories Explained

**Available Categories**:
1. **Stationery** - Pens, pencils, erasers, rulers
2. **Books** - Textbooks, notebooks, workbooks
3. **Bags** - School bags, backpacks
4. **Essentials** - Water bottles, lunch boxes, umbrellas
5. **Clothing** - Uniforms, shoes
6. **Other** - Items that don't fit above

**Purpose**: Groups similar items together for better organization

---

## 🌍 Language Support

**English Name** (Required):
- What appears by default
- Example: "Notebooks"

**Sinhala Name** (Optional):
- Appears alongside English
- Example: "සටහන් පොත්"

**Future**: Tamil translations can be added later

---

## 💡 Best Practices

### ✅ DO:
- Use clear, simple item names
- Choose appropriate icons
- Set logical sort order
- Add Sinhala translations when possible
- Group items by category

### ❌ DON'T:
- Use spaces in Item ID
- Use UPPERCASE in Item ID
- Delete items actively being requested
- Change IDs of existing items
- Forget to set category

---

## 🔍 Example: Adding "Raincoats"

**Scenario**: Monsoon season, need to add raincoats

**Steps**:
1. Click "Add New Item"
2. Fill:
   - ID: `raincoats`
   - Name (EN): `Raincoats`
   - Name (SI): `වැසි කබා`
   - Icon: `🧥`
   - Category: `Clothing`
   - Sort Order: `13`
3. Click "Add Item"
4. Raincoats now appear in request form!

**Later** (after monsoon):
1. Find "Raincoats" in table
2. Click Delete
3. Confirm
4. Item removed from new requests

---

## 🛠️ Troubleshooting

### "Item ID already exists"
- Choose a different ID
- IDs must be unique
- Try: `markers2`, `markers_blue`, etc.

### "No items found"
- You're the first! Add items to get started
- Use setup guide to initialize defaults
- Or add items one by one

### Changes not appearing in form?
- Refresh the request page
- Clear browser cache
- Check browser console for errors

### Can't save item?
- Make sure all required fields filled
- Check ID has no spaces or capitals
- Verify you're logged in as admin

---

## 📱 Where Users See These Items

After you add/edit items, they appear here:
1. **Relief Request Form**: `/relief-requests`
2. Click "Request Donation"
3. Scroll to "Select Materials Needed"
4. Your items appear in a grid with icons

**Users see**:
- Item icon (emoji)
- Item name (English)
- Category label
- Quantity input field

---

## 📈 Impact on Statistics

**Statistics Dashboard** automatically includes your items:
- Shows total requested per item
- Shows total fulfilled per item
- Shows pending per item
- Beautiful progress bars

**No extra work needed** - it just works!

---

## 🎓 Real-World Examples

### Seasonal Items:

**December (Exams)**:
- Add: Exam pads, rulers, erasers
- Sort order: 1-5 (make them first)

**June (New Year)**:
- Add: New uniforms, shoes, bags
- Sort order: 1-10

**April (New Year)**:
- Remove: Old textbooks
- Add: New grade textbooks

### Emergency Items:

**Flood Relief**:
- Add: Towels, blankets, dry rations
- Category: Essentials
- High priority (low sort order)

**Post-Disaster**:
- Remove: Emergency items
- Keep: Regular school supplies

---

## 🔐 Security Note

**Who can manage items?**
- ✅ Admin users only
- ❌ Regular users cannot

**Who can see items?**
- ✅ Everyone (public)
- Used in request forms

---

## 📞 Need Help?

**Common Questions**:

**Q: How many items can I add?**
A: No limit! Add as many as needed.

**Q: Can I reorder items?**
A: Yes! Edit the Sort Order field.

**Q: Can I add custom categories?**
A: Currently limited to preset categories. Contact developer to add more.

**Q: Do changes affect old requests?**
A: No, old requests keep their original items.

**Q: Can I restore deleted items?**
A: No, delete is permanent. Add again if needed.

---

## ✅ Quick Checklist

When adding a new item:
- [ ] Item ID is lowercase, no spaces
- [ ] English name is clear and descriptive
- [ ] Icon is relevant and recognizable
- [ ] Category is appropriate
- [ ] Sort order positions it correctly
- [ ] Sinhala name added (if known)
- [ ] Tested in request form

---

## 🎯 Summary

**In 3 Steps**:
1. **Add**: Click "Add New Item" → Fill form → Save
2. **Edit**: Click Edit icon → Modify → Save
3. **Delete**: Click Delete icon → Confirm

**That's it!** Items update in real-time across the site.

---

**Happy Managing! 🎉**

For technical details, see: `DYNAMIC_RELIEF_ITEMS_SUMMARY.md`
