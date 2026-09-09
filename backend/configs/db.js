import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB connected");
    } catch (error) {
        console.log("DB connection failed:", error.message);
        process.exit(1); // Server ko band kar do agar DB connect nahi hua
    }
};

export default connectDb;