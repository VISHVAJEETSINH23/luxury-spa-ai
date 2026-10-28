// Turns the owner's password into the ADMIN_PASSWORD_HASH value.
//   npm run hash-password
// The password is typed in, never passed on the command line, so it does not
// end up in shell history.
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question("Owner password (min 12 characters): ", (password) => {
  rl.close();
  if (!password || password.length < 12) {
    console.error("\nToo short. Use at least 12 characters.");
    process.exit(1);
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
  console.log(`\nADMIN_PASSWORD_HASH=scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`);
  console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
});
