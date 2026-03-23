import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { z } from "zod";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const ALLOWED_ACTIONS = ["findMany", "findFirst", "findUnique", "count"] as const;

const QueryInputSchema = z.object({
  model: z.enum(["User", "Order"]),
  action: z.enum(ALLOWED_ACTIONS),
  args: z
    .object({
      where: z.record(z.string(), z.unknown()).optional(),
      select: z.record(z.string(), z.boolean()).optional(),
      orderBy: z.record(z.string(), z.unknown()).optional(),
      take: z.number().int().positive().max(100).optional(), // จำกัด max 100 rows
      skip: z.number().int().nonnegative().optional(),
    })
    .optional()
    .default({}),
});

export type QueryInput = z.infer<typeof QueryInputSchema>; // TypeScript type สำหรับ input

export async function runQuery(input: unknown) {
  // 1. Validate input
  const { model, action, args } = QueryInputSchema.parse(input);

  // 2. เลือก Prisma model
  const prismaModel = prisma[model.toLowerCase() as keyof typeof prisma] as any;

  if (!prismaModel || typeof prismaModel[action] !== "function") {
    throw new Error(`Invalid model or action: ${model}.${action}`);
  }

  // 3. Run query
  const result = await prismaModel[action](args);
  return result;
}