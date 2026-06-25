const authService = require('../modules/auth/auth.service');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function runTest() {
  console.log("Running Forgot Password Flow backend logic test...");
  try {
    // 1. Find a registered user with password_hash
    const user = await db.queryOne("SELECT id, email, full_name, password_hash FROM users WHERE password_hash IS NOT NULL LIMIT 1");
    if (!user) {
      console.error("No registered user found with password_hash. Please seed database.");
      process.exit(1);
    }
    console.log(`Found test user: ${user.full_name} (${user.email})`);

    // Save current password hash
    const oldHash = user.password_hash;

    // 2. Call forgotPassword service method
    // Mock transporter.sendMail temporarily so we intercept the reset email
    const mailConfig = require('../config/mail');
    const originalSendMail = mailConfig.transporter.sendMail;
    
    let sentEmail = null;
    mailConfig.transporter.sendMail = async (options) => {
      console.log("Mocked transporter.sendMail called!");
      sentEmail = options;
      return { messageId: 'mock-id-123' };
    };

    console.log("Calling forgotPassword service...");
    const forgotRes = await authService.forgotPassword({ email: user.email });
    console.log("forgotPassword response:", forgotRes);

    if (!sentEmail) {
      throw new Error("Email was not sent by forgotPassword service");
    }

    console.log(`Reset Email Subject: "${sentEmail.subject}"`);
    console.log(`Reset Email Body Length: ${sentEmail.html.length} chars`);

    // Extract token from reset URL
    const urlMatch = sentEmail.html.match(/href="([^"]+)"/);
    if (!urlMatch) {
      throw new Error("Could not extract reset link from email HTML");
    }
    const resetUrl = urlMatch[1];
    console.log("Extracted Reset URL:", resetUrl);

    // Decode URL entities if any (e.g. &amp; to &)
    const normalizedUrl = resetUrl.replace(/&amp;/g, '&');

    const tokenMatch = normalizedUrl.match(/\?token=([^&]+)/);
    if (!tokenMatch) {
      throw new Error("Could not extract token from reset URL");
    }
    const token = tokenMatch[1];
    console.log("Extracted Reset Token:", token);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token Payload:", decoded);

    // 3. Reset password using the token
    const newPassword = "NewSecuredPassword123";
    console.log(`Resetting password to: ${newPassword}`);
    const resetRes = await authService.resetPassword({ token, password: newPassword });
    console.log("resetPassword response:", resetRes);

    // Verify password hash changed in DB
    const updatedUser = await db.queryOne("SELECT password_hash FROM users WHERE id = ?", [user.id]);
    const isNewPasswordMatch = await bcrypt.compare(newPassword, updatedUser.password_hash);
    const isOldPasswordMatch = await bcrypt.compare(newPassword, oldHash);

    console.log("New password matches DB hash:", isNewPasswordMatch);
    console.log("Old password matches DB hash (should be false):", isOldPasswordMatch);

    if (isNewPasswordMatch && !isOldPasswordMatch) {
      console.log("SUCCESS: Password reset flow backend test passed!");
    } else {
      throw new Error("Password reset verification failed");
    }

    // Revert password back to original so we don't disrupt user login
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [oldHash, user.id]);
    console.log("Restored original password hash to prevent disruption.");

    // Restore mail sender
    mailConfig.transporter.sendMail = originalSendMail;

  } catch (err) {
    console.error("TEST FAILED:", err);
  } finally {
    process.exit(0);
  }
}

runTest();
