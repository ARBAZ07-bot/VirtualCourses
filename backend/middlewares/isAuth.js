import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        let { token } = req.cookies

        if (!token) {
            return res.status(401).json({ message: "user doesn't have token" })
        }

        let verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        req.userId = verifyToken.userId
        next()
    } catch (error) {
        console.log(error)
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired, please login again" })
        }
        return res.status(401).json({ message: "Invalid token" })
    }
}

export default isAuth