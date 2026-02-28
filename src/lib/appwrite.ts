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
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
export const COMMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID;
export const ADMINS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ADMINS_COLLECTION_ID;
export const MUNICIPALITIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MUNICIPALITIES_COLLECTION_ID;
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export { client, databases, storage, account, ID, Query };
