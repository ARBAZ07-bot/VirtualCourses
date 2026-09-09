import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Config ek hi baar load hote time set ho jayega
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) {
            return null;
        }

        const uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });

        // File delete karne se pehle check kar lo ki wo exist karti hai ya nahi
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return uploadResult.secure_url;
    } catch (error) {
        console.log(error);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return null;
    }
};

export default uploadOnCloudinary;