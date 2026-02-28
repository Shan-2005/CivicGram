import { Client, Databases, Storage, Account, ID, Query } from 'appwrite';

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'your_project_id');

const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);

// Appwrite Database and Collection IDs stored in env
// Important: Users must provide these values in .env.local
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'your_database_id';
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'your_collection_id';
const COMMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID || '';
const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'your_bucket_id';

export { client, databases, storage, account, DATABASE_ID, COLLECTION_ID, COMMENTS_COLLECTION_ID, BUCKET_ID, ID, Query };
