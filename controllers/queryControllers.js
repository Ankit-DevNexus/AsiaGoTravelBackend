import queryModel from "../models/queryModels.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

//Helper function to send email
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"AsiaGo Travels" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📨 Email sent successfully to: ${to}`);
        return info;
    } catch (error) {
        console.error("❌ Email sending failed:", error.response?.text || error.message);
        throw new Error("Failed to send email");
    }
};


// Controller: Handle Travel Query Form Submission
export const submitQueryForm = async (req, res) => {
    try {
        const {
            fullName,
            mobileNumber,
            email,
            numberOfTravellers,
            monthOfTravel,
            message,
            packageId,
            packageTitle,
        } = req.body;

        // ✅ Validate input
        if (
            !fullName ||
            !mobileNumber ||
            !email ||
            !numberOfTravellers ||
            !monthOfTravel ||
            !message
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        // ✅ Save to database
        const newQuery = await queryModel.create({
            fullName,
            mobileNumber,
            email,
            numberOfTravellers,
            monthOfTravel,
            message,
            packageId,
            packageTitle,
        });

        console.log("✅ Query saved in DB:", newQuery._id);

        // --- 📩 Admin Email ---
        const adminEmailHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 20px; border-radius: 10px; color: #333;">
        <div style="background: linear-gradient(135deg, #0078d4, #00bcd4); color: white; padding: 18px 24px; border-radius: 10px 10px 0 0; text-align: center;">
          <h2 style="margin: 0;">🌏 New Travel Enquiry Received</h2>
          <p style="margin: 4px 0 0;">AsiaGo Travels — Bringing the World Closer</p>
        </div>

        <div style="background: #fff; padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
          <table style="width: 100%;">
            <tr><td><strong>Full Name:</strong></td><td>${fullName}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>Mobile Number:</strong></td><td>${mobileNumber}</td></tr>
            <tr><td><strong>Number of Travellers:</strong></td><td>${numberOfTravellers}</td></tr>
            <tr><td><strong>Month of Travel:</strong></td><td>${monthOfTravel}</td></tr>
            ${
              packageTitle
                ? `<tr><td><strong>Package Title:</strong></td><td>${packageTitle}</td></tr>`
                : ""
            }
            ${
              packageId
                ? `<tr><td><strong>Package ID:</strong></td><td>${packageId}</td></tr>`
                : ""
            }
            <tr><td><strong>Message:</strong></td><td>${message}</td></tr>
          </table>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="font-size: 12px; color: #777; text-align: center;">
            Auto-generated from travel enquiry form.<br/>
            <strong>AsiaGo Travels</strong> • 
            <a href="https://www.asiagotravels.com" target="_blank" style="color: #0078d4;">www.asiagotravels.com</a>
          </p>
        </div>
      </div>
    `;

        // --- 💌 Auto Reply to User ---
        const userEmailHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <div style="background-color: #1E88E5; color: white; padding: 16px 24px;">
          <h2 style="margin: 0;">Thank You, ${fullName}!</h2>
        </div>

        <div style="padding: 24px;">
          <p>Hi ${fullName},</p>
          <p>We’ve received your travel query${
            packageTitle ? ` for <strong>${packageTitle}</strong>` : ""
          } and our team will get back to you soon with the best itinerary and pricing options.</p>

          <div style="background: #f9f9f9; border-left: 4px solid #1E88E5; padding: 12px 16px; margin: 16px 0;">
            <p><strong>Your Message:</strong></p>
            <p>${message}</p>
          </div>

          <p>Meanwhile, explore our 
            <a href="https://asiagotravel.com/packages" target="_blank" style="color: #1E88E5;">latest travel packages</a>.
          </p>

          <p>Warm regards,<br><strong>The AsiaGo Travels Team</strong></p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="font-size: 12px; color: #777;">This is an automated email — please do not reply directly.</p>
        </div>
      </div>
    `;

        // ✅ Send both emails
        await sendEmail(
      process.env.ADMIN_EMAIL,
      `New Travel Query: ${packageTitle || "General Enquiry"}`,
      adminEmailHTML
    );

    await sendEmail(
      email,
      `Thanks for your enquiry${packageTitle ? " about " + packageTitle : ""}!`,
      userEmailHTML
    );


        return res.status(200).json({
            success: true,
            message: "Query submitted successfully and emails sent.",
            data: newQuery,
        });
    } catch (error) {
        console.error("❌ Error in query form:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
