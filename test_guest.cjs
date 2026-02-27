const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Simulate guest client (no secret key)
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function testGuestAccess() {
    try {
        console.log("Testing Guest Access (as 'any')...");
        const response = await databases.listDocuments(
            process.env.VITE_APPWRITE_DATABASE_ID,
            process.env.VITE_APPWRITE_COLLECTION_ID
        );
        console.log(`Success! Found ${response.documents.length} documents.`);
    } catch (e) {
        console.error("Guest Access Failed:", e.message);
        if (e.response) {
            console.log("Response Body:", JSON.stringify(e.response, null, 2));
        }
    }
}

testGuestAccess();
