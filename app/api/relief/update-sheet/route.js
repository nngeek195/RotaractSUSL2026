import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { type, data, action } = await req.json(); // Added 'action' parameter

    // 1. Get Sheet URL from Firestore
    const db = getAdminDb();
    const configSnapshot = await db.collection('reliefConfig').limit(1).get();
    
    if (configSnapshot.empty) {
      console.warn('No reliefConfig document found in Firestore.');
      return new Response(JSON.stringify({ message: 'No relief config found' }), { status: 404 });
    }

    const config = configSnapshot.docs[0].data();
    const sheetUrl = config.googleSheetUrl;

    if (!sheetUrl) {
       console.warn('No Google Sheet URL configured in reliefConfig.');
       return new Response(JSON.stringify({ message: 'No Google Sheet URL configured' }), { status: 400 });
    }

    // 2. Extract Spreadsheet ID
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      console.warn('Invalid Google Sheet URL format:', sheetUrl);
      return new Response(JSON.stringify({ message: 'Invalid Google Sheet URL' }), { status: 400 });
    }
    const spreadsheetId = match[1];

    // 3. Initialize Auth
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error('Missing Firebase credentials for Google Sheets auth');
        return new Response(JSON.stringify({ message: 'Server misconfiguration: Missing Credentials' }), { status: 500 });
    }

    const serviceAccountAuth = new JWT({
      email: process.env.FIREBASE_CLIENT_EMAIL,
      key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);

    await doc.loadInfo();
    
    // 4. Select/Create Worksheet
    let sheetTitle = type === 'request' ? 'Material Requests' : 'Donation Offers';
    let sheet = doc.sheetsByTitle[sheetTitle];
    
    const headers = type === 'request' 
        ? ['Date', 'Status', 'School Name', 'District', 'Address', 'Contact Person', 'Contact Number', 'Email', 'Items Requested', 'Token', 'Description']
        : ['Date', 'Status', 'Donor Name', 'District', 'Contact Number', 'Email', 'Items Offered', 'Message', 'ID'];

    if (!sheet) {
      sheet = await doc.addSheet({ title: sheetTitle, headerValues: headers });
    } else {
        try {
            await sheet.loadHeaderRow();
        } catch (e) {
            await sheet.setHeaderRow(headers);
        }
    }

    // 5. Identify Unique Key
    let uniqueKey = '';
    let uniqueValue = '';

    if (type === 'request') {
        uniqueKey = 'Token';
        uniqueValue = data.requestToken;
    } else if (type === 'donation') {
        uniqueKey = 'ID';
        uniqueValue = data.id;
    }

    // 6. Find Row
    const rows = await sheet.getRows();
    
    // DEBUG LOGGING START
    console.log(`--- DEBUG SEARCH ---`);
    console.log(`Searching for Unique Key: "${uniqueKey}"`);
    console.log(`Searching for Unique Value: "${uniqueValue}"`);
    console.log(`Total Rows in Sheet: ${rows.length}`);
    if (rows.length > 0) {
        console.log(`First 5 Row Values for column "${uniqueKey}":`);
        rows.slice(0, 5).forEach((r, i) => {
            console.log(`Row ${i + 1}: "${r.get(uniqueKey)}"`);
        });
    }
    // DEBUG LOGGING END

    let existingRow = rows.find(row => row.get(uniqueKey) === uniqueValue);

    // Fallback for Donations without ID (Legacy Data Support)
    if (!existingRow && type === 'donation' && action === 'delete') {
        console.log('Row not found by ID. Attempting fallback search by Name + Contact...');
        existingRow = rows.find(row => 
            row.get('Donor Name') === data.donorName && 
            row.get('Contact Number') === data.contactNumber
        );
    }

    // 7. Perform Action
    if (action === 'delete') {
        console.log(`Attempting delete for ${uniqueKey}: ${uniqueValue}`);
        
        if (existingRow) {
            console.log(`Found row (Row #${existingRow.rowNumber}). Deleting...`);
            await existingRow.delete();
            console.log('Successfully deleted row.');
        } else {
            console.warn(`Row NOT found for ${uniqueKey}: ${uniqueValue}. Cannot delete.`);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Default: Update or Append
    const dateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
    let rowData = {};

    if (type === 'request') {
        const itemsStr = Array.isArray(data.items) 
            ? data.items.map(i => `${i.name} (${i.quantity})`).join(', ')
            : '';

        rowData = {
            'Date': dateStr,
            'Status': data.status || 'pending',
            'School Name': data.schoolName,
            'District': data.district,
            'Address': data.address || '',
            'Contact Person': data.contactPerson || '',
            'Contact Number': data.contactNumber,
            'Email': data.email || '',
            'Items Requested': itemsStr,
            'Token': data.requestToken,
            'Description': data.description || ''
        };
    } else if (type === 'donation') {
        rowData = {
            'Date': dateStr,
            'Status': data.status || 'pending',
            'Donor Name': data.donorName,
            'District': data.district,
            'Contact Number': data.contactNumber,
            'Email': data.email || '',
            'Items Offered': data.itemsOffered,
            'Message': data.message || '',
            'ID': data.id || ''
        };
    }

    if (existingRow) {
        console.log(`Found existing row for ${uniqueKey}: ${uniqueValue}. Updating...`);
        existingRow.assign(rowData);
        await existingRow.save();
    } else {
        console.log(`No existing row found for ${uniqueKey}: ${uniqueValue}. Appending new row...`);
        await sheet.addRow(rowData);
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('CRITICAL Error updating Google Sheet:', error);
    return new Response(JSON.stringify({ 
        error: error.message,
        details: 'Check server logs for more info.'
    }), { status: 500 }); 
  }
}
