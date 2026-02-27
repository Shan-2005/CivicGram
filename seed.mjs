import { Client, Databases, ID } from 'node-appwrite';
import 'dotenv/config';

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey('standard_6bebbf5a1f1df4a9f0922b75b4406ba5fe101bf23c98625ed4ffcccf4d4b2c0655e39460a7fe27bbb058c2266a3943d09194a5b2f2c46cbbb2104905c8505a72e79d433a030df7951ea6bafaa261481ef6e04b076521b554fc2309d8c5f146e24bf8884e263a6ea4c5bc9ad5426280460b5ee8afa713755ca492b90abe9cced9');

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = process.env.VITE_APPWRITE_COLLECTION_ID || '';

const initialIssues = [
    {
        title: "Massive Pothole on Main St",
        description: "A very deep pothole that is causing damage to cars. Needs immediate attention.",
        category: "Roads",
        image_url: "/pothole.png",
        latitude: 37.7858,
        longitude: -122.4064,
        priority: "CRITICAL",
        status: "REPORTED",
        trust_score: 0.95,
        is_verified: true,
        user_id: "urban_explorer",
        upvotes: 42,
        comment_count: 2
    },
    {
        title: "Illegal Garbage Dumping",
        description: "Large pile of construction waste left on the sidewalk for 3 days.",
        category: "Garbage",
        image_url: "/garbage.png",
        latitude: 37.7749,
        longitude: -122.4194,
        priority: "HIGH",
        status: "VERIFIED",
        trust_score: 0.88,
        is_verified: true,
        user_id: "clean_city_fan",
        upvotes: 28,
        comment_count: 0
    },
    {
        title: "Broken Water Main",
        description: "Water gushing out from the pavement. Wasting a lot of water.",
        category: "Water",
        image_url: "/water_main.png",
        latitude: 37.7649,
        longitude: -122.4294,
        priority: "CRITICAL",
        status: "IN_PROGRESS",
        trust_score: 0.98,
        is_verified: true,
        user_id: "water_watcher",
        upvotes: 56,
        comment_count: 1
    },
    {
        title: "Street Light Out",
        description: "The entire block is dark at night. Safety concern for pedestrians.",
        category: "Safety",
        image_url: "/street_light.png",
        latitude: 37.7949,
        longitude: -122.3994,
        priority: "MEDIUM",
        status: "REPORTED",
        trust_score: 0.75,
        is_verified: false,
        user_id: "night_walker",
        upvotes: 12,
        comment_count: 0
    }
];

async function seedDatabase() {
    console.log(`Seeding database: ${DATABASE_ID}, collection: ${COLLECTION_ID}`);

    for (const issue of initialIssues) {
        try {
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                issue
            );
            console.log(`Successfully created issue: ${issue.title}`);
        } catch (error) {
            console.error(`Failed to create issue: ${issue.title}`);
            if (error.response) {
                import('fs').then(fs => fs.writeFileSync('error.json', JSON.stringify(error.response, null, 2)));
            }
        }
    }

    console.log("Seeding complete.");
}

seedDatabase();
