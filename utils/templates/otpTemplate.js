// utils/templates/otpTemplate.js
const otpTemplate = (otp, gymName, purpose = "verification") => {
  const subject =
    purpose === "login" ? "Login Verification" : "Account Verification";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">🏋️ Gymkhaana</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Secure ${subject}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 20px;">
            <h2 style="color: #4F46E5; margin-top: 0;">Hi ${
              gymName || "User"
            },</h2>
            
            ${
              purpose === "login"
                ? `<p>We received a login request for your account at <strong>${gymName}</strong>.</p>`
                : `<p>Thank you for registering with Gymkhaana!</p>`
            }
            
            <p>Your One-Time Password (OTP) is:</p>
            
            <div style="background: #4F46E5; color: white; text-align: center; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                ${otp}
            </div>
            
            <p style="color: #666;">
                <strong>This OTP is valid for 5 minutes only.</strong><br>
                ${
                  purpose === "login"
                    ? "If you didn't request this login, please ignore this email or contact support."
                    : "If you didn't create this account, please ignore this email."
                }
            </p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p><strong>Need help?</strong></p>
                <p>Contact us at <a href="mailto:support@gymkhaana.com">support@gymkhaana.com</a></p>
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            <p>© 2025 Gymkhaana. All rights reserved.</p>
        </div>
    </div>
    `;
};

module.exports = { otpTemplate };
