import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Please fill in all fields" });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "User Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    //sending welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to CineSpot 🎬✨",
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; color: #333;">
      <h2 style="color: #E50914;">Welcome to <span style="color: #000;">CineSpot</span> 🎉</h2>
      <p>Hey there,</p>
      <p>We're absolutely thrilled to have you join the CineSpot family!</p>
      <p>Your account has been successfully created with the email ID:</p>
      <p style="font-weight: bold; color: #555;">${email}</p>
      <p>
        Get ready to:
        <ul>
          <li>🍿 Discover trending movies & series</li>
          <li>🎞️ Explore hidden gems</li>
          <li>✨ Stay updated with the latest entertainment buzz</li>
        </ul>
      </p>
      <p>We're here to make your screen time epic. 💥</p>
      <br/>
      <p style="font-size: 14px; color: #666;">Cheers,</p>
      <p style="font-size: 14px; color: #666;">— The CineSpot Team</p>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Registered successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// user login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Please fill in all fields" });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid Email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//user logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token",{
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//user verify
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account Already Verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify Your Account - CineSpot",
      html: `
  <div style="font-family: 'Segoe UI', sans-serif; background-color: #f2f2f2; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
      <h2 style="text-align: center; color: #E50914;">CineSpot</h2>
      <p style="font-size: 18px; color: #333;">Hello,</p>
      <p style="font-size: 16px; color: #555;">To verify your account, please use the following One-Time Password (OTP):</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 30px; font-weight: bold; background: #E50914; color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; letter-spacing: 5px;">
          ${otp}
        </span>
      </div>

      <p style="font-size: 14px; color: #888;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      <p style="font-size: 14px; color: #888;">If you did not request this email, you can safely ignore it.</p>

      <br/>
      <p style="font-size: 14px; color: #666;">Regards,</p>
      <p style="font-size: 14px; color: #666;">The CineSpot Team</p>
    </div>
  </div>
  `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//verify email
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.json({
      success: false,
      message: "Please provide both userId and otp",
    });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.verifyOtpExpiredAt < Date.now()) {
      return res.json({ success: false, message: "OTP has expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpiredAt = 0;

    await user.save();
    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//user authenticated

export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//password reset otp
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: "Please provide email" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpiredAt = Date.now() + 15 * 60 * 1000;

    await user.save();
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Reset Your Password - CineSpot",
      html: `
  <div style="font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
      <h2 style="text-align: center; color: #E50914; margin-bottom: 10px;">CineSpot</h2>
      <h3 style="text-align: center; color: #333;">Reset Your Password</h3>
      <p style="font-size: 16px; color: #555;">Hi ${user.name || "there"},</p>
      <p style="font-size: 15px; color: #555;">
        You recently requested to reset your password. Please use the following One-Time Password (OTP) to proceed:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; background: #E50914; color: white; padding: 12px 28px; border-radius: 10px; display: inline-block; letter-spacing: 6px;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #888; text-align: center;">This OTP is valid for 15 minutes.</p>
      <p style="font-size: 14px; color: #888; text-align: center;">If you did not request this, you can ignore this email safely.</p>
      <br/>
      <p style="font-size: 14px; color: #666;">Best regards,</p>
      <p style="font-size: 14px; color: #666;">The CineSpot Team</p>
    </div>
  </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// reset user password

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "Please fill all fields" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpiredAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpiredAt = 0;

    await user.save();
    return res.json({
      success: true,
      message: "Password has been changed successfully.",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
