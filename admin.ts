import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (admins.length === 0) {
    console.log("No ADMIN account found.");
  } else {
    console.log("Admin accounts found:");
    console.table(admins);
  }
}

main()
  .catch((error) => {
    console.error("Error checking admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
