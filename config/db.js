import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    try {
        if (cached.conn) {
            return cached.conn;
        }

        if (!cached.promise) {
            const opts = {
                bufferCommands: false,
            };

            // Check if MongoDB URI is defined
            if (!process.env.MONGODB_URI) {
                throw new Error("MONGODB_URI is not defined in environment variables");
            }

            console.log("Connecting to MongoDB...");
            cached.promise = mongoose.connect(
                `${process.env.MONGODB_URI}/sparrow-sports`,
                opts
            ).then(connection => {
                console.log("MongoDB connected successfully");
                return connection;
            });
        }

        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

export default connectDB;