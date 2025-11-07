import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectToMongo } from "@/lib/mongo";
import { User } from "@/models/User";

export async function POST(req: Request) {
    try {
        await connectToMongo();

        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required." },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found." },
                { status: 404 }
            );
        }

        // Optional: check if OTP is cleared (user verified)
        // if (user.otp) {
        //   return NextResponse.json(
        //     { success: false, message: "Please verify your email first." },
        //     { status: 403 }
        //   );
        // }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, message: "Invalid password." },
                { status: 401 }
            );
        }

        // Login successful → return user info (without password)
        const { passwordHash, otp, otpExpiresAt, ...userData } = user.toObject();

        return NextResponse.json({
            success: true,
            message: "Login successful.",
            user: userData,
        });
    } catch (err: any) {
        console.error("Login error:", err);
        return NextResponse.json(
            { success: false, message: "Login failed." },
            { status: 500 }
        );
    }
}
