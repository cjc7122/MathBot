import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

async function connectToMongoDB() {
  client = new MongoClient(uri, options);
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB');
    clientPromise = Promise.resolve(client); // Resolve clientPromise here
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Call the connectToMongoDB function to initiate the connection
connectToMongoDB()
  .catch((error) => {
    console.error('Error setting up MongoDB client:', error);
    process.exit(1);
  });

// Export clientPromise after it has been resolved within connectToMongoDB
export default async function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    throw new Error('MongoDB client promise is not yet initialized.');
  }
  return clientPromise;
}
