import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = process.env.ADMIN_EMAIL ?? "admin@donatestream.com";

async function main() {
  const deleted = await prisma.adminUser.deleteMany({
    where: { email: EMAIL },
  });
  if (deleted.count === 0) {
    console.log("Администратор с таким email не найден:", EMAIL);
    return;
  }
  console.log("Удалён администратор:", EMAIL);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
