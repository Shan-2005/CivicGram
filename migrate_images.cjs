const { Client, Storage, Databases, ID, Query } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey('standard_6bebbf5a1f1df4a9f0922b75b4406ba5fe101bf23c98625ed4ffcccf4d4b2c0655e39460a7fe27bbb058c2266a3943d09194a5b2f2c46cbbb2104905c8505a72e79d433a030df7951ea6bafaa261481ef6e04b076521b554fc2309d8c5f146e24bf8884e263a6ea4c5bc9ad5426280460b5ee8afa713755ca492b90abe9cced9');

const storage = new Storage(client);
const databases = new Databases(client);

const bucketId = process.env.VITE_APPWRITE_BUCKET_ID;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = process.env.VITE_APPWRITE_COLLECTION_ID;

const imagesToUpload = [
    { filename: 'pothole.png', title: 'Massive Pothole on Main St' },
    { filename: 'garbage.png', title: 'Illegal Garbage Dumping' },
    { filename: 'water_main.png', title: 'Broken Water Main' },
    { filename: 'street_light.png', title: 'Street Light Out' },
];

async function migrateImages() {
    console.log(`Starting image migration to Bucket: ${bucketId}...`);
    for (const image of imagesToUpload) {
        try {
            const filePath = path.join(__dirname, 'public', image.filename);

            // 1. Upload to bucket
            console.log(`Uploading ${image.filename}...`);
            const file = await storage.createFile(
                bucketId,
                ID.unique(),
                InputFile.fromPath(filePath, image.filename)
            );
            console.log(`✅ Uploaded as File ID: ${file.$id}`);

            // 2. Generate View URL
            const fileUrl = `${process.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${file.$id}/view?project=${process.env.VITE_APPWRITE_PROJECT_ID}`;

            // 3. Find the matching Database Document
            const response = await databases.listDocuments(
                databaseId,
                collectionId,
                [Query.equal('title', image.title)]
            );

            if (response.documents.length > 0) {
                const docId = response.documents[0].$id;
                // 4. Update Document with New Cloud URL
                await databases.updateDocument(
                    databaseId,
                    collectionId,
                    docId,
                    { image_url: fileUrl }
                );
                console.log(`✅ Updated Document ${docId} with new Image URL`);
            } else {
                console.log(`⚠️ Could not find document with title: ${image.title}`);
            }

        } catch (error) {
            console.error(`❌ Failed to process ${image.filename}:`, error.message || error);
        }
    }
    console.log("Migration Complete!");
}

migrateImages();
