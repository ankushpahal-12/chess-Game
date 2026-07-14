import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Force Node.js to use Google/Cloudflare DNS instead of the system resolver.
// This fixes ESERVFAIL errors when the local DNS can't resolve MongoDB Atlas
// SRV and TXT records (common on Windows, corporate networks, and some ISPs).
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);


dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chess';

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10_000, // Give up after 10s if can't reach server
  socketTimeoutMS: 45_000,
  family: 4, // Force IPv4 — fixes many DNS SRV lookup failures on some networks
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3_000;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const connectDB = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(MONGO_URI, MONGO_OPTIONS);
      console.log('MongoDB connected successfully');
      return;
    } catch (error: any) {
      const isDnsError =
        error?.code === 'ESERVFAIL' ||
        error?.code === 'ENOTFOUND' ||
        error?.syscall === 'querySrv';

      console.error(
        `MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`,
        error?.message ?? error
      );

      if (isDnsError) {
        console.error(
          '\n DNS/Network issue detected. Please check:\n' +
          '  1. Your MongoDB Atlas cluster name in .env is correct\n' +
          '  2. Your IP is whitelisted in Atlas → Network Access\n' +
          '  3. You are not behind a VPN or firewall blocking DNS SRV lookups\n'
        );
      }

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error('All MongoDB connection attempts failed.');
        throw new Error('MongoDB unavailable after max retries');
      }
    }
  }
};

