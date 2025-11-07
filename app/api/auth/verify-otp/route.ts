import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongo";
import { User } from "@/models/User";

export async function POST(req: Request) {
    try {
        await connectToMongo();
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: "Email and OTP are required." },
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

        if (!user.otp || !user.otpExpiresAt || user.otp !== otp) {
            return NextResponse.json(
                { success: false, message: "Invalid OTP." },
                { status: 400 }
            );
        }

        if (user.otpExpiresAt < new Date()) {
            return NextResponse.json(
                { success: false, message: "OTP expired." },
                { status: 400 }
            );
        }

        // OTP is valid → clear it
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: "OTP verified successfully." });
    } catch (err: any) {
        console.error("Verify OTP error:", err);
        return NextResponse.json(
            { success: false, message: "OTP verification failed." },
            { status: 500 }
        );
    }
}
