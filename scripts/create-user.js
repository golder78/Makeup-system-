import "dotenv/config";
import bcrypt from "bcrypt";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { prisma } from "../src/db/prisma.js";

const rl = readline.createInterface({ input: stdin, output: stdout });

const name = (await rl.question("Name: ")).trim();
const email = (await rl.question("Email: ")).trim().toLowerCase();
const password = await rl.question("Password: ");

if (!name || !email || !password || password.length < 8) {
  console.error(
    "Name and email required and password must be at least 8 characters.",
  );
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

await prisma.user.upsert({
  where: { email },
  update: { name, passwordHash },
  create: { name, email, passwordHash },
});

console.log(`User ${email} created/updated.`);
await prisma.$disconnect();
rl.close();
