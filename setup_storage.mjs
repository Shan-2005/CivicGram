import { Client, Storage, Databases, ID, InputFile } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// 1. Initialize Clients
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey('standard_6bebbf5a1f1df4a9f0922b75b4406ba5fe101bf23c98625ed4ffcccf4d4b2c0655e39460a7fe27bbb058c2266a3943d09194a5b2f2c46cbbb2104905c8505a72e79d433a030df7951ea6bafaa261481ef6e04b076521b554fc2309d8c5f146e24bf8884e263a6ea4c5bc9ad5426280460b5ee8afa713755ca492b90abe9cced9');

const storage = new Storage(client);

async function setupStorage() {
    console.log("Setting up Appwrite Storage...");
    try {
        // Create the bucket
        const bucket = await storage.createBucket(
            ID.unique(),
            "CivicGram Images",
            ["any"], // Permissions
            false,  // enable file security
            true,   // enable auto-generation of image formats in API
            10485760, // max file size 10MB
            ["jpg", "png", "jpeg", "webp"] // allowed extensions
        );

        console.log(`✅ Success! Storage Bucket Created with ID: ${bucket.$id}`);
        console.log(`Writing Bucket ID to .env.local...`);

        // Append to .env.local
        fs.appendFileSync('.env.local', `\nVITE_APPWRITE_BUCKET_ID=${bucket.$id}\n`);
    } catch (e) {
        console.error("Failed to create bucket:", e);
    }
}

setupStorage();
