import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    try {
        if (cached.conn && mongoose.connection.readyState === 1) {
            return cached.conn;
        }

        if (!cached.promise || mongoose.connection.readyState === 0) {
            cached.conn = null;
            cached.promise = null;

            const opts = {
                bufferCommands: false,
                autoIndex: false,
                serverSelectionTimeoutMS: 10000, // 10 second timeout for DNS / connection
                family: 4 // Prefer IPv4 to avoid Node.js IPv6 SRV DNS issues
            };

            if (!process.env.MONGODB_URI) {
                throw new Error("MONGODB_URI is not defined in environment variables");
            }

            let connectionUri = process.env.MONGODB_URI.trim();
            // Check if URI already specifies a database name
            const hasDatabaseInUri = /^mongodb(\+srv)?:\/\/[^\/]+\/[a-zA-Z0-9_\-]+/i.test(connectionUri);
            if (!hasDatabaseInUri) {
                connectionUri = `${connectionUri.replace(/\/+$/, '')}/sparrow-sports`;
            }

            console.log("Connecting to MongoDB...");
            cached.promise = mongoose.connect(
                connectionUri,
                opts
            ).then(connection => {
                console.log("MongoDB connected successfully");
                return connection;
            }).catch(err => {
                cached.promise = null;
                cached.conn = null;
                throw err;
            });
        }

        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        cached.promise = null;
        cached.conn = null;
        throw error;
    }
}

export default connectDB;