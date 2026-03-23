import { PrismaPg } form "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    // สร้างข้อมูล user และ order สำหรับทดสอบ 5 รายการ
    for (let i = 1; i <= 5; i++) {
        const user = await prisma.user.create({
            data: {
                name: `User ${i}`,
                email: `user${i}@example.com`,
            },
        });

        await prisma.order.create({
            data: {
                item: `Item ${i}`,
                quantity: i,
                userId: user.id, // เชื่อมกับ user ที่สร้างขึ้น
            },
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });