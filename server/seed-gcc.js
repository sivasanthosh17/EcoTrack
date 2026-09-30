import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import Department from './models/Department.js';
import gccData from './data/gcc-public-data.json' with { type: 'json' };

dotenv.config();

const seedGccPublicData = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecotrack_db';
    await mongoose.connect(mongoURI);

    await Organization.findOneAndUpdate(
      {},
      gccData.organization,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    for (const department of gccData.departments) {
      await Department.findOneAndUpdate(
        { name: department.name },
        department,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`[GCC Seed] Loaded ${gccData.departments.length} official department records.`);
    console.log('[GCC Seed] Source:', gccData.source.officialSources[1]);
  } catch (error) {
    console.error('[GCC Seed Error]', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedGccPublicData();
