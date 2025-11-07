import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secretKey = "121212"

export async function createToken(payload: { userId: any; email: any; userType: any }) {
    try {
        const iat = Math.floor(Date.now() / 1000)
        const exp = iat + 60 * 60 * 24 * 7

        const token = await new SignJWT({ ...payload, iat, exp })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setExpirationTime(exp)
            .setIssuedAt(iat)
            .setNotBefore(iat)
            .sign(new TextEncoder().encode(secretKey))

        return token
    } catch (error) {
        console.error("Token creation error:", error)
        return null
    }
}

type AuthPayload = {
    userId: number
    email: string
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secretKey))
        return payload as AuthPayload
    } catch (error) {
        console.error("Token verification error:", error)
        return null
    }
}

export async function setTokenCookie(token: string) {
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
    })
}

// Utility function to get the userId from the token in a request
export async function getUserFromToken() {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) {
        return null
    }
    const payload = await verifyToken(token)
    return payload ? payload.userId : null
}