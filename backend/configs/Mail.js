const sendMail = async (to, otp) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Virtual Courses", email: process.env.EMAIL },
        to: [{ email: to }],
        subject: "Reset Your Password",
        htmlContent: `<p>Your OTP for Password Reset is <b>${otp}</b>.
        It expires in 5 minutes.</p>`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log("Mail sending failed:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.log("Mail sending failed:", error.message);
    return false;
  }
};

export default sendMail;