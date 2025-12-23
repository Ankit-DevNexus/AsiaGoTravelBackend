import nodemailer from "nodemailer";
import contactUsModel from "../models/contactUsModels.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"Contact Us" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email Sent successfully to: ${to}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    if (error.response) console.error("Gmail response:", error.response);
    throw new Error("Failed to send email");
  }
};

// submit Contact us form
export const submitContactUs = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      noOfTrvelers,
      dateOfTravel,
      destinationType,
      destination,
      noOfdays,
      noOfNights,
      message,
    } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    const newContact = await contactUsModel.create({
      name,
      phone,
      email,
      noOfTrvelers,
      dateOfTravel,
      destinationType,
      destination,
      noOfdays,
      noOfNights,
      message,
    });
    // console.log("Form saved to database:", newContact._id);

    const adminEmailHTML = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 20px; border-radius: 10px; color: #333; line-height: 1.6;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0078d4, #00bcd4); color: white; padding: 18px 24px; border-radius: 10px 10px 0 0; text-align: center;">
      <h2 style="margin: 0; font-size: 22px;">📩 New Contact Form Submission</h2>
      <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">AsiaGo Travels — We’ve received a new message</p>
    </div>

    <!-- Content -->
    <div style="background: #fff; padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; width: 30%;"><strong>Name:</strong></td>
          <td>${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Email:</strong></td>
          <td>${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top;"><strong>Message:</strong></td>
          <td>${message || "—"}</td>
        </tr>
      </table>

      <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />

      <!-- Footer -->
      <p style="font-size: 12px; color: #777; text-align: center; margin: 0;">
        This message was automatically generated from your website's contact form.<br />
        <strong>AsiaGo Travels</strong> • 
        <a href="https://www.asiagotravels.com" target="_blank" style="color: #0078d4; text-decoration: none;">www.asiagotravels.com</a>
      </p>
    </div>
  </div>
`;

    const userEmailHTML = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #1E88E5; color: white; padding: 16px 24px;">
      <h2 style="margin: 0;">Thank You for Reaching Out, ${name}!</h2>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 16px;">Hi ${name},</p>
      <p style="font-size: 15px; line-height: 1.6;">
        We’ve received your message and our travel experts will get back to you soon.  
        Thank you for showing interest in <strong>AsiaGoTravel</strong> — your gateway to unforgettable adventures.
      </p>

      <div style="background: #f9f9f9; border-left: 4px solid #1E88E5; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Your Message:</strong></p>
        <p style="margin: 8px 0 0;">${message}</p>
      </div>

      <p style="font-size: 15px;">
        Meanwhile, you can explore our latest <a href="https://asiagotravel.com/packages" target="_blank" style="color: #1E88E5; text-decoration: none;">travel packages</a>  
        and <a href="https://asiagotravel.com/destinations" target="_blank" style="color: #1E88E5; text-decoration: none;">top destinations</a>.
      </p>

      <p style="font-size: 15px;">Warm regards,<br /><strong>The AsiaGoTravel Team</strong></p>

      <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 12px; color: #777;">
        This is an automated email — please do not reply directly.  
        For urgent queries, contact us at <a href="mailto:support@asiagotravel.com" style="color: #1E88E5;">support@asiagotravel.com</a>.
      </p>
    </div>
  </div>
`;

    await sendEmail(
      process.env.ADMIN_EMAIL,
      "New Contact Form Submission",
      adminEmailHTML
    );
    await sendEmail(email, "Thanks for contacting us!", userEmailHTML);

    return res.status(200).json({
      success: true,
      message: "Form submitted successfully and emails sent.",
      data: newContact,
    });
  } catch (error) {
    console.error("❌ Error in contact form:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};
