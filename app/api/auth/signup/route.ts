import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectToMongo } from "@/lib/mongo";
import { User } from "@/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        await connectToMongo();

        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: "Name, email, and password are required." },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User already exists." },
                { status: 400 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
        });

        // Generate OTP
        const otp = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit OTP
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiration

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        // Verification URL — frontend page that will call /verify-otp
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const verificationLink = `${frontendUrl}/verify-otp?email=${encodeURIComponent(email)}`;

        // Send OTP verification email
        await sendEmail({
            to: email,
            subject: "Verify your Nyay Sahayak account",
            text: `Hi ${name},\n\nPlease verify your account by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 10 minutes. The OTP for the same is ${otp}`,
        });

        return NextResponse.json({ success: true, message: "User registered successfully. Verification email sent." });
    } catch (err: any) {
        console.error("Signup error:", err);
        return NextResponse.json({ success: false, message: "Registration failed." }, { status: 500 });
    }
}
