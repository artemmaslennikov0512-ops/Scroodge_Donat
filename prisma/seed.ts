import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { RolePermissions } from "../lib/adminPermissions";

// Явно грузим .env из корня проекта (рядом с package.json)
config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

const DEV_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@donatestream.com";
const DEV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "SuperSecurePassword123!";

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    throw new Error(
      "В production задайте ADMIN_PASSWORD в .env перед созданием администратора (npm run db:seed)"
    );
  }
  const existing = await prisma.adminUser.findUnique({
    where: { email: DEV_ADMIN_EMAIL },
  });

  if (existing) {
    console.log("Администратор уже существует:", existing.email);
    return;
  }

  const hashedPassword = await bcrypt.hash(DEV_ADMIN_PASSWORD, 10);
  const permissions = RolePermissions.SUPER_ADMIN as unknown as string[];

  const admin = await prisma.adminUser.create({
    data: {
      email: DEV_ADMIN_EMAIL,
      password: hashedPassword,
      name: "Главный администратор",
      role: "SUPER_ADMIN",
      permissions,
      mustChangePassword: true,
    },
  });

  console.log("Создан аккаунт разработчика:");
  console.log("  Email:", admin.email);
  console.log("  Роль:", admin.role);
  console.log("  Обязательная смена пароля при первом входе: да");
  console.log(
    "  Пароль: задан через ADMIN_PASSWORD или по умолчанию (см. prisma/seed.ts)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
