import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey('standard_6bebbf5a1f1df4a9f0922b75b4406ba5fe101bf23c98625ed4ffcccf4d4b2c0655e39460a7fe27bbb058c2266a3943d09194a5b2f2c46cbbb2104905c8505a72e79d433a030df7951ea6bafaa261481ef6e04b076521b554fc2309d8c5f146e24bf8884e263a6ea4c5bc9ad5426280460b5ee8afa713755ca492b90abe9cced9');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '';

async function listCollections() {
    try {
        const response = await databases.listCollections(DATABASE_ID);
        console.log("Collections found:");
        for (const collection of response.collections) {
            console.log(`- Name: "${collection.name}", ID: "${collection.$id}"`);
        }

        console.log('\nAttributes for "civicgram":');
        const attributes = await databases.listAttributes(DATABASE_ID, 'civicgram');
        const fs = await import('fs');
        fs.writeFileSync('attrs.json', JSON.stringify(attributes.attributes.map(a => `${a.key} (${a.type}, required: ${a.required})`), null, 2));
        console.log("Saved to attrs.json");
    } catch (error) {
        console.error("Failed to list collections:", error);
    }
}

listCollections();
