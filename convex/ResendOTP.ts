import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { Resend as ResendAPI } from "resend";

/**
 * Email OTP for Ivano PMS (Lobby Light Continue flow). No password.
 * Requires AUTH_RESEND_KEY and a verified from-address on Resend.
 */
export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      }
    };
    return generateRandomString(random, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: process.env.AUTH_EMAIL_FROM ?? "Ivano PMS <signin@techivano.com>",
      to: [email],
      subject: "Your Ivano PMS sign in code",
      text: `Your sign in code is ${token}. It expires in 15 minutes.`
    });
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  }
});
