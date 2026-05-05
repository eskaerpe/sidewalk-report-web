import "dotenv/config";
import prismaClientPkg from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const { PrismaClient } = prismaClientPkg;

const globalForPrisma = globalThis;

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not configured. Add it to your .env file.");
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
