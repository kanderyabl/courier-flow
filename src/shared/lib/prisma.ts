import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

let prismaClient = globalForPrisma.prisma;

const LEGACY_STRICT_SSL_MODES = new Set([
  "prefer",
  "require",
  "verify-ca",
]);

function preserveStrictSslVerification(connectionString: string): string {
  try {
    const databaseUrl = new URL(connectionString);
    const sslMode = databaseUrl.searchParams.get("sslmode");

    if (sslMode && LEGACY_STRICT_SSL_MODES.has(sslMode)) {
      databaseUrl.searchParams.set("sslmode", "verify-full");
    }

    return databaseUrl.toString();
  } catch {
    // Let the database adapter report malformed connection strings.
    return connectionString;
  }
}

export function getPrisma(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  const configuredConnectionString = process.env.DATABASE_URL;

  if (!configuredConnectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const connectionString = preserveStrictSslVerification(
    configuredConnectionString,
  );

  const adapter = new PrismaPg({
    connectionString,
  });

  prismaClient = new PrismaClient({
    adapter,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}
