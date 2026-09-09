import multer from "multer";
import path from "path";

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public")
    },
    filename: (req, file, cb) => {
        // Unique naam banate hain taaki files overwrite na hon
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|mp4|mov|avi|mkv/
    const isValidType = allowedTypes.test(path.extname(file.originalname).toLowerCase())

    if (isValidType) {
        cb(null, true)
    } else {
        cb(new Error("Only image and video files are allowed"), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit, video ke hisaab se adjust kar sakte ho
})

export default upload