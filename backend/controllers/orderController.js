import Course from "../models/courseModel.js";
import razorpay from 'razorpay'
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
})

export const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const options = {
      amount: course.price * 100, // in paisa
      currency: 'INR',
      receipt: courseId.toString(),
    };

    const order = await razorpayInstance.orders.create(options);

    // Order ka record database mein save karo (abhi unpaid)
    await Order.create({
      course: courseId,
      student: req.userId,
      razorpay_order_id: order.id,
      amount: course.price,
      currency: order.currency,
      isPaid: false
    });

    return res.status(200).json(order);
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: `Order creation failed ${err}` });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, courseId } = req.body
    const userId = req.userId

    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingOrder = await Order.findOne({ razorpay_order_id })
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Agar ye order pehle hi verify ho chuka hai, dobara process mat karo
    if (existingOrder.isPaid) {
      return res.status(200).json({ message: "Payment already verified" });
    }

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

    if (orderInfo.status !== 'paid') {
      return res.status(400).json({ message: "Payment verification failed (invalid signature)" });
    }

    // Amount match check - jitna pay hua hai wo isi course ke price ke barabar ho
    if (orderInfo.amount !== course.price * 100) {
      return res.status(400).json({ message: "Payment amount mismatch for this course" });
    }

    // Payment id nikaal lo record ke liye
    let paymentId
    try {
      const payments = await razorpayInstance.orders.fetchPayments(razorpay_order_id)
      const successfulPayment = payments.items.find(p => p.status === "captured")
      paymentId = successfulPayment?.id
    } catch (err) {
      console.log("Could not fetch payment id:", err.message)
    }

    // Order ko paid mark karo
    existingOrder.isPaid = true
    existingOrder.paidAt = new Date()
    if (paymentId) existingOrder.razorpay_payment_id = paymentId
    await existingOrder.save()

    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    if (!course.enrolledStudents.includes(userId)) {
      course.enrolledStudents.push(userId);
      await course.save();
    }

    return res.status(200).json({ message: "Payment verified and enrollment successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error during payment verification" });
  }
};