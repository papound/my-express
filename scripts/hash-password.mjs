import crypto from "node:crypto";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
  return `pbkdf2:sha256:${ITERATIONS}:${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function main() {
  let password = process.argv[2];
  if (!password) {
    const rl = readline.createInterface({ input, output });
    password = await rl.question("Enter password to hash: ");
    rl.close();
  }

  if (!password) {
    console.error("Error: password cannot be empty.");
    process.exit(1);
  }

  console.log(hashPassword(password));
}

main();
