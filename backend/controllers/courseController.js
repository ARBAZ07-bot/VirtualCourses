import uploadOnCloudinary from "../configs/cloudinary.js"
import Course from "../models/courseModel.js"
import Lecture from "../models/lectureModel.js"
import User from "../models/userModel.js"

// create Courses
export const createCourse = async (req, res) => {
    try {
        const { title, category } = req.body
        if (!title || !category) {
            return res.status(400).json({ message: "title and category is required" })
        }

        // Sirf educator hi course bana sakta hai
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        if (user.role !== "educator") {
            return res.status(403).json({ message: "Only educators can create courses" })
        }

        const course = await Course.create({
            title,
            category,
            creator: req.userId
        })

        return res.status(201).json(course)
    } catch (error) {
        return res.status(500).json({ message: `Failed to create course ${error}` })
    }
}

export const getPublishedCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true }).populate("lectures reviews")

        // Ye route public hai (koi login zaroori nahi), isliye paid lectures ka
        // videoUrl yahan se hide karna zaroori hai. Sirf preview-free lectures
        // ka video bhejo, baaki lectures ka sirf title/meta info bhejo.
        const safeCourses = courses.map(course => {
            const courseObj = course.toObject()
            courseObj.lectures = courseObj.lectures.map(lecture => {
                if (!lecture.isPreviewFree) {
                    const { videoUrl, ...rest } = lecture
                    return rest
                }
                return lecture
            })
            return courseObj
        })

        return res.status(200).json(safeCourses)
    } catch (error) {
        return res.status(500).json({ message: `Failed to get All courses ${error}` })
    }
}

export const getCreatorCourses = async (req, res) => {
    try {
        const userId = req.userId
        const courses = await Course.find({ creator: userId })
        return res.status(200).json(courses)
    } catch (error) {
        return res.status(500).json({ message: `Failed to get creator courses ${error}` })
    }
}

export const editCourse = async (req, res) => {
    try {
        const { courseId } = req.params
        const { title, subTitle, description, category, level, price, isPublished } = req.body

        let course = await Course.findById(courseId)
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }

        // Sirf course ka creator hi edit kar sakta hai
        if (course.creator.toString() !== req.userId) {
            return res.status(403).json({ message: "You are not authorized to edit this course" })
        }

        let thumbnail
        if (req.file) {
            thumbnail = await uploadOnCloudinary(req.file.path)
        }

        const updateData = { title, subTitle, description, category, level, price, isPublished }
        if (thumbnail) {
            updateData.thumbnail = thumbnail
        }

        course = await Course.findByIdAndUpdate(courseId, updateData, { new: true })
        return res.status(201).json(course)
    } catch (error) {
        return res.status(500).json({ message: `Failed to update course ${error}` })
    }
}

export const getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params
        let course = await Course.findById(courseId)
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }
        return res.status(200).json(course)
    } catch (error) {
        return res.status(500).json({ message: `Failed to get course ${error}` })
    }
}

export const removeCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Sirf course ka creator hi delete kar sakta hai
        if (course.creator.toString() !== req.userId) {
            return res.status(403).json({ message: "You are not authorized to remove this course" })
        }

        // Course ke saath uski saari lectures bhi delete kar do
        if (course.lectures.length > 0) {
            await Lecture.deleteMany({ _id: { $in: course.lectures } })
        }

        await course.deleteOne();
        return res.status(200).json({ message: "Course Removed Successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: `Failed to remove course ${error}` })
    }
};

//create lecture
export const createLecture = async (req, res) => {
    try {
        const { lectureTitle } = req.body
        const { courseId } = req.params

        if (!lectureTitle || !courseId) {
            return res.status(400).json({ message: "Lecture Title required" })
        }

        const course = await Course.findById(courseId)
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }

        // Sirf course ka creator hi lecture add kar sakta hai
        if (course.creator.toString() !== req.userId) {
            return res.status(403).json({ message: "You are not authorized to add lectures to this course" })
        }

        // Lecture banate time usse uske course se bhi link kar do
        const lecture = await Lecture.create({ lectureTitle, course: courseId })
        course.lectures.push(lecture._id)
        await course.save()
        await course.populate("lectures")

        return res.status(201).json({ lecture, course })
    } catch (error) {
        return res.status(500).json({ message: `Failed to Create Lecture ${error}` })
    }
}

export const getCourseLecture = async (req, res) => {
    try {
        const { courseId } = req.params
        const course = await Course.findById(courseId).populate("lectures")
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }

        const isCreator = course.creator.toString() === req.userId
        const isEnrolled = course.enrolledStudents.some(id => id.toString() === req.userId)

        // Sirf enrolled students ya course ka creator hi full lectures dekh sakte hain
        if (!isCreator && !isEnrolled) {
            // Preview wali lectures (isPreviewFree) sabko dikha do, baaki hide kar do
            const previewLectures = course.lectures.filter(lec => lec.isPreviewFree)
            return res.status(200).json({ ...course.toObject(), lectures: previewLectures, isLocked: true })
        }

        return res.status(200).json(course)
    } catch (error) {
        return res.status(500).json({ message: `Failed to get Lectures ${error}` })
    }
}

export const editLecture = async (req, res) => {
    try {
        const { lectureId } = req.params
        const { isPreviewFree, lectureTitle } = req.body
        const lecture = await Lecture.findById(lectureId)
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" })
        }

        if (req.file) {
            const videoUrl = await uploadOnCloudinary(req.file.path)
            lecture.videoUrl = videoUrl
        }
        if (lectureTitle) {
            lecture.lectureTitle = lectureTitle
        }
        if (isPreviewFree !== undefined) {
            lecture.isPreviewFree = isPreviewFree
        }

        await lecture.save()
        return res.status(200).json(lecture)
    } catch (error) {
        return res.status(500).json({ message: `Failed to edit Lectures ${error}` })
    }
}

export const removeLecture = async (req, res) => {
    try {
        const { lectureId } = req.params
        const lecture = await Lecture.findByIdAndDelete(lectureId)
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" })
        }

        // Lecture ko uske course se bhi hata do
        await Course.updateOne(
            { lectures: lectureId },
            { $pull: { lectures: lectureId } }
        )
        return res.status(200).json({ message: "Lecture Remove Successfully" })

    } catch (error) {
        return res.status(500).json({ message: `Failed to remove Lectures ${error}` })
    }
}

// get Creator data
export const getCreatorById = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "get Creator error" });
    }
};