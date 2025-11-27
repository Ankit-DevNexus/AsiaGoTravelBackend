import userModel from "../models/userModels.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

// REGISTER ADMIN
export const registerUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, confirmPassword } = req.body;

    if (!name || !email || !phoneNumber || !password || !confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });

    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });

    const existingUser = await userModel.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });

    const newUser = await userModel.create({
      name,
      email,
      phoneNumber,
      password,
      confirmPassword,
    });

    res.status(201).json({
      success: true,
      message: "Signup successful! Please login to continue.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// LOGIN (Email or Phone)
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({
        success: false,
        message: "Email/Phone and Password required.",
      });

    const isEmail = username.includes("@");
    const query = isEmail
      ? { email: username.toLowerCase() }
      : { phoneNumber: Number(username) };

    const user = await userModel.findOne(query);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error(" Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log("Raw resetToken sent in email:", resetToken);
    console.log("Hashed token saved in DB:", user.resetPasswordToken);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Async email sending (non-blocking)
    (async () => {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          // secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"AsiaGo Travels" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Password Reset - AsiaGo Travels",
          html: `
            <p>Hello ${user.name},</p>
            <p>Click below to reset your password:</p>
            <a href="${resetUrl}" target="_blank">${resetUrl}</a>
            <p>This link expires in 10 minutes.</p>
            `,
        });
      } catch (mailErr) {
        console.error("Email send error:", mailErr.message);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email (valid for 10 minutes).",
    });
  } catch (error) {
    console.error(" Forgot Password error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

//  RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    // console.log("🔑 Token received from URL:", token);
    // console.log("🔒 Hashed token for lookup:", crypto.createHash("sha256").update(token).digest("hex"));

    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is missing in the URL." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    console.log("🔑 Token received from URL:", token);
    console.log("🔒 Hashed token for lookup:", hashedToken);

    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token." });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset Password error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// import userModel from "../models/userModels.js";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";
// import crypto from "crypto";
// import nodemailer from "nodemailer";

// export const registerUser = async (req, res) => {
//     try {
//         const { name, email, phoneNumber, password, confirmPassword } = req.body;

//         if (!name || !email || !phoneNumber || !password || !confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All Fields are required(name, email, password)",
//             });
//         }

//         if (password !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Password do not match",
//             });
//         }

//         const existingUser = await userModel.findOne({
//             $or: [{ email }, { phoneNumber }],
//         });

//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User already exists with this email or phone Number",
//             });
//         }

//         const newUser = await userModel.create({
//             name,
//             email,
//             phoneNumber,
//             password,
//             confirmPassword,
//         });

//         res.status(201).json({
//             success: true,
//             message: "Signup successful! Please login to continue.",
//             userModel: {
//                 id: newUser._id,
//                 name: newUser.name,
//                 email: newUser.email,
//                 phoneNumber: newUser.phoneNumber,
//             },
//         });
//     } catch (error) {
//         console.error("Signup error:", error);
//         res.status(500).json({ success: false, message: "Server Error", error: error.message });
//     }
// };

// export const loginUser = async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         if (!username || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Email or Phone Number and password are required",
//             });
//         }

//         let user;

//         // ✅ Detect if username is email or phone number
//         if (username.includes("@")) {
//             // If contains '@', treat as email
//             user = await userModel.findOne({ email: username.toLowerCase() });
//         } else if (!isNaN(username)) {
//             // If numeric, treat as phone number
//             user = await userModel.findOne({ phoneNumber: Number(username) });
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid login input — please use email or phone number.",
//             });
//         }

//         // ✅ Check if user exists
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found with this email or phone number",
//             });
//         }

//         // ✅ Compare password
//         const isMatch = await user.comparePassword(password);
//         if (!isMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid Password",
//             });
//         }

//         // ✅ Generate token only on login
//         const token = user.generateAuthToken();

//         res.status(200).json({
//             success: true,
//             message: "Login successful",
//             token,
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 phoneNumber: user.phoneNumber,
//             },
//         });
//     } catch (error) {
//         console.error("Login Error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Server error",
//             error: error.message,
//         });
//     }
// };

// export const forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;

//         const user = await userModel.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not Found" });
//         }
//         const resetToken = crypto.randomBytes(32).toString("hex");
//         user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
//         user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
//         await user.save();

//         const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

//         const transporter = nodemailer.createTransport({
//             host: process.env.SMTP_HOST,
//             port: process.env.SMTP_PORT,
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//         });

//         await transporter.sendMail({
//             from: `"AsiaGo Travels" <${process.env.EMAIL_USER}>`,
//             to: email,
//             subject: "Password Reset - AsiaGo Travels",
//             html: `<p>Hello ${user.name},</p>
//                 <p>You requested to reset your password. Click below to reset:</p>
//                 <a href="${resetUrl}" target="_blank">${resetUrl}</a>
//                 <p>This link expires in 10 minutes.</p>`,
//         });

//         res.status(200).json({
//             success: true,
//             message: "Password reset link to your email",
//         });
//     } catch (error) {
//         console.error("Forgot Password Error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Server Error",
//             error: error.message
//         });
//     }
// };

// export const resetPassword = async (req, res) => {
//     try {
//         const { token } = req.params;
//         const { password } = req.body;

//         const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//         const user = await userModel.findOne({
//             resetPasswordToken: hashedToken,
//             resetPasswordExpires: { $gt: Date.now() },
//         });

//         if (!user)
//             return res.status(400).json({ success: false, message: "Invalid or expired token" });

//         user.password = password;
//         user.confirmPassword = password;
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpires = undefined;
//         await user.save();
//         res.status(200).json({ success: true, message: "Password reset successful" });
//     } catch (error) {
//         console.error("❌ Reset password error:", error);
//         res.status(500).json({ success: false, message: "Server error", error: error.message });
//     }
// };
