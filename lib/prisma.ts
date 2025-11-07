// lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// 1. Extend the global scope in development to hold the Prisma client instance
// This prevents excessive instantiation during Next.js hot-reloads.
declare global {
    // This definition is only used in development environments.
    var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// 2. Initialize the Prisma Client based on the environment
if (process.env.NODE_ENV === 'production') {
    // In production, instantiate the client normally
    prisma = new PrismaClient();
} else {
    // In development, use the global object
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}

// 3. Export the single, reusable instance
export default prisma;