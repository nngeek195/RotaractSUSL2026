# Relief Items Initialization Script

This script initializes the default relief items in Firestore. Run this once to populate the `reliefItems` collection.

## How to Run

### Option 1: Using Firebase Console (Recommended)

1. Go to Firebase Console → Firestore Database
2. Create a new collection called `reliefItems`
3. Add documents with the following data:

**Document 1:**
```
id: "notebooks"
name: "Notebooks"
nameSi: "සටහන් පොත්"
icon: "📓"
category: "Stationery"
sortOrder: 1
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 2:**
```
id: "textbooks"
name: "Textbooks"
nameSi: "පාඨ පොත්"
icon: "📚"
category: "Books"
sortOrder: 2
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 3:**
```
id: "pens"
name: "Pens"
nameSi: "පෑන"
icon: "🖊️"
category: "Stationery"
sortOrder: 3
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 4:**
```
id: "pencils"
name: "Pencils"
nameSi: "පැන්සල්"
icon: "✏️"
category: "Stationery"
sortOrder: 4
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 5:**
```
id: "erasers"
name: "Erasers"
nameSi: "මකන ගුම්"
icon: "🧹"
category: "Stationery"
sortOrder: 5
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 6:**
```
id: "rulers"
name: "Rulers"
nameSi: "උසුලන"
icon: "📏"
category: "Stationery"
sortOrder: 6
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 7:**
```
id: "schoolbags"
name: "School Bags"
nameSi: "පාසල් බෑග්"
icon: "🎒"
category: "Bags"
sortOrder: 7
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 8:**
```
id: "waterbottles"
name: "Water Bottles"
nameSi: "වතුර බෝතල්"
icon: "💧"
category: "Essentials"
sortOrder: 8
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 9:**
```
id: "lunchboxes"
name: "Lunch Boxes"
nameSi: "දිවා ආහාර පෙට්ටි"
icon: "🍱"
category: "Essentials"
sortOrder: 9
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 10:**
```
id: "umbrellas"
name: "Umbrellas"
nameSi: "කුඩ"
icon: "☂️"
category: "Essentials"
sortOrder: 10
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 11:**
```
id: "shoes"
name: "School Shoes"
nameSi: "පාසල් සපත්තු"
icon: "👞"
category: "Clothing"
sortOrder: 11
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

**Document 12:**
```
id: "uniforms"
name: "School Uniforms"
nameSi: "පාසල් නිල ඇඳුම්"
icon: "👔"
category: "Clothing"
sortOrder: 12
createdAt: [current timestamp]
updatedAt: [current timestamp]
```

---

### Option 2: Using the Admin Panel (Easier)

1. Login to admin panel
2. Navigate to `/admin/relief-items`
3. Click "Add New Item" button
4. Fill in the details for each item above
5. Click "Add Item" to save

---

### Option 3: Programmatic Initialization (Advanced)

Create a file `scripts/initReliefItems.js`:

```javascript
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // ... your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultItems = [
  { id: "notebooks", name: "Notebooks", nameSi: "සටහන් පොත්", icon: "📓", category: "Stationery", sortOrder: 1 },
  { id: "textbooks", name: "Textbooks", nameSi: "පාඨ පොත්", icon: "📚", category: "Books", sortOrder: 2 },
  { id: "pens", name: "Pens", nameSi: "පෑන", icon: "🖊️", category: "Stationery", sortOrder: 3 },
  { id: "pencils", name: "Pencils", nameSi: "පැන්සල්", icon: "✏️", category: "Stationery", sortOrder: 4 },
  { id: "erasers", name: "Erasers", nameSi: "මකන ගුම්", icon: "🧹", category: "Stationery", sortOrder: 5 },
  { id: "rulers", name: "Rulers", nameSi: "උසුලන", icon: "📏", category: "Stationery", sortOrder: 6 },
  { id: "schoolbags", name: "School Bags", nameSi: "පාසල් බෑග්", icon: "🎒", category: "Bags", sortOrder: 7 },
  { id: "waterbottles", name: "Water Bottles", nameSi: "වතුර බෝතල්", icon: "💧", category: "Essentials", sortOrder: 8 },
  { id: "lunchboxes", name: "Lunch Boxes", nameSi: "දිවා ආහාර පෙට්ටි", icon: "🍱", category: "Essentials", sortOrder: 9 },
  { id: "umbrellas", name: "Umbrellas", nameSi: "කුඩ", icon: "☂️", category: "Essentials", sortOrder: 10 },
  { id: "shoes", name: "School Shoes", nameSi: "පාසල් සපත්තු", icon: "👞", category: "Clothing", sortOrder: 11 },
  { id: "uniforms", name: "School Uniforms", nameSi: "පාසල් නිල ඇඳුම්", icon: "👔", category: "Clothing", sortOrder: 12 }
];

async function initializeItems() {
  try {
    for (const item of defaultItems) {
      await addDoc(collection(db, 'reliefItems'), {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added: ${item.name}`);
    }
    console.log('All items initialized successfully!');
  } catch (error) {
    console.error('Error initializing items:', error);
  }
}

initializeItems();
```

Then run: `node scripts/initReliefItems.js`

---

## Firestore Security Rules

Make sure to add these rules to allow public read access to reliefItems:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Relief Items - Public read, admin write
    match /reliefItems/{itemId} {
      allow read: if true;  // Anyone can read items
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

---

## Verification

After initialization:
1. Visit `/relief-requests` page
2. Click "Request Donation"
3. Verify all 12 items display in the form
4. Visit `/admin/relief-items` to manage items

---

## Notes

- **sortOrder**: Lower numbers appear first in the form
- **id**: Must be unique, lowercase, no spaces
- **nameSi**: Sinhala translations (optional but recommended)
- **icon**: Use emoji characters
- **category**: Groups items together

---

## Troubleshooting

**Items not showing up?**
- Check Firestore rules allow public read
- Verify collection name is exactly `reliefItems`
- Check browser console for errors

**"No items found" message?**
- Items will show fallback defaults if fetch fails
- Check your Firebase configuration
- Verify internet connection
