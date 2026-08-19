import mongoose from 'mongoose';
import dns from 'dns';

export const configureDNS = () => {
  const dnsServer = process.env.DNS_SERVER;
  const servers = ['1.1.1.1', '8.8.8.8'];
  if (dnsServer && dnsServer.trim() && !servers.includes(dnsServer.trim())) {
    servers.push(dnsServer.trim());
  }
  try {
    dns.setServers(servers);
  } catch (error) {
    console.warn(`Failed to set custom DNS servers (${servers.join(', ')}): ${error.message}`);
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    console.error('Error: MONGODB_URI is missing in backend/.env file');
    process.exit(1);
  }

  // Ensure DNS is configured before connecting to MongoDB
  configureDNS();

  try {
    const conn = await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
