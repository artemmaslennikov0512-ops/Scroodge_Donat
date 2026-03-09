/**
 * Проверка БД: подключение, пользователи, пароли для входа.
 * Запуск: npx tsx scripts/check-db.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Проверка БД...\n");

  try {
    await db.$connect();
    console.log("✓ Подключение к БД успешно");
  } catch (e) {
    console.error("✗ Ошибка подключения к БД:", (e as Error).message);
    process.exit(1);
  }

  const totalUsers = await db.user.count();
  console.log(`  Всего пользователей: ${totalUsers}`);

  const usersWithPassword = await db.user.count({
    where: { password: { not: null } },
  });
  console.log(`  С паролем (могут войти по email/пароль): ${usersWithPassword}`);

  const usersWithEmail = await db.user.count({
    where: { email: { not: null } },
  });
  console.log(`  С указанным email: ${usersWithEmail}`);

  if (usersWithPassword > 0) {
    const sample = await db.user.findMany({
      where: { password: { not: null } },
      select: { id: true, email: true, username: true, password: true },
      take: 3,
    });
    console.log("\n  Примеры пользователей с паролем (email для входа):");
    for (const u of sample) {
      const hash = u.password ? `${u.password.slice(0, 20)}...` : "null";
      console.log(`    - email: ${u.email ?? "(нет)"}, username: ${u.username ?? "(нет)"}, password: ${hash}`);
    }
  } else {
    console.log("\n  ⚠ Нет ни одного пользователя с паролем. Вход по email/пароль невозможен.");
    console.log("  Создайте пользователя через регистрацию /register или добавьте пароль в БД.");
  }

  await db.$disconnect();
  console.log("\nГотово.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
