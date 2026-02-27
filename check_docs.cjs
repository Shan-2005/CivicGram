const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey('standard_6bebbf5a1f1df4a9f0922b75b4406ba5fe101bf23c98625ed4ffcccf4d4b2c0655e39460a7fe27bbb058c2266a3943d09194a5b2f2c46cbbb2104905c8505a72e79d433a030df7951ea6bafaa261481ef6e04b076521b554fc2309d8c5f146e24bf8884e263a6ea4c5bc9ad5426280460b5ee8afa713755ca492b90abe9cced9');

const databases = new Databases(client);

async function checkDocs() {
    try {
        const response = await databases.listDocuments(
            process.env.VITE_APPWRITE_DATABASE_ID,
            process.env.VITE_APPWRITE_COLLECTION_ID
        );
        console.log("Found Documents:");
        response.documents.forEach(doc => {
            console.log(`- Title: ${doc.title}`);
            console.log(`  Image URL: ${doc.image_url}`);
        });
    } catch (e) {
        console.error(e);
    }
}

checkDocs();
