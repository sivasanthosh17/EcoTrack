/**
 * Copies every collection from your local MongoDB into another MongoDB database,
 * such as MongoDB Atlas, so the deployed site has the same accounts and data as localhost.
 *
 * Usage (from the server folder):
 *   node copy-to-atlas.js "<MongoDB Atlas connection string>"
 *
 * Collections in the target database are replaced with the local copy.
 * Run it again any time to reset the online data to match localhost.
 */
import mongoose from 'mongoose';

const { MongoClient } = mongoose.mongo;

const sourceURI = process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27017/ecotrack_db';
const targetURI = process.argv[2];

if (!targetURI) {
  console.error('Usage: node copy-to-atlas.js "<MongoDB Atlas connection string>"');
  process.exit(1);
}

if (targetURI === sourceURI) {
  console.error('The target database is the same as the local database. Nothing to copy.');
  process.exit(1);
}

const source = new MongoClient(sourceURI, { serverSelectionTimeoutMS: 5000 });
const target = new MongoClient(targetURI, { serverSelectionTimeoutMS: 15000 });

try {
  await source.connect();
  console.log(`Connected to local database: ${source.db().databaseName}`);

  await target.connect();
  const targetDb = target.db();
  console.log(`Connected to target database: ${targetDb.databaseName}`);

  const collections = await source.db().listCollections({ type: 'collection' }).toArray();

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;

    const docs = await source.db().collection(name).find().toArray();
    await targetDb.collection(name).deleteMany({});
    if (docs.length > 0) {
      await targetDb.collection(name).insertMany(docs);
    }
    console.log(`  ${name}: ${docs.length} documents copied`);
  }

  console.log('Done. The deployed site now has the same data as localhost.');
} catch (err) {
  console.error(`Copy failed: ${err.message}`);
  console.error('Check that local MongoDB is running, the Atlas password is correct, and Atlas Network Access allows your IP.');
  process.exitCode = 1;
} finally {
  await source.close();
  await target.close();
}
