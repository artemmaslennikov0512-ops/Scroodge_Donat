/**
 * Установить новый пароль пользователю по email.
 * Запуск: npx tsx scripts/set-password.ts <email> <новый_пароль>
 * Пример: npx tsx scripts/set-password.ts maslenok1298@icloud.com MyNewPass123
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const db = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Использование: npx tsx scripts/set-password.ts <email> <новый_пароль>");
    process.exit(1);
  }

  const user = await db.user.findFirst({
    where: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" } },
    select: { id: true, email: true },
  });

  if (!user) {
    console.error("Пользователь с таким email не найден:", email);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: { password: hash },
  });

  console.log("Пароль обновлён для:", user.email);
  console.log("Теперь войдите с этим email и новым паролем.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
