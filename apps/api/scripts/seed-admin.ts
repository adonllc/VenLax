import "dotenv/config";
import { seedAdmin } from "../src/modules/admin-auth/admin-auth.service";
import { generateURI } from "otplib";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@venlaxiq.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123!";

  const totpSecret = await seedAdmin(email, password);
  const otpAuthUrl = generateURI({ issuer: "VenlaxIQ Admin", label: email, secret: totpSecret });

  console.log("\n=== Admin user created ===");
  console.log(`Email:       ${email}`);
  console.log(`Password:    ${password}`);
  console.log(`TOTP secret: ${totpSecret}`);
  console.log(`\nOTP Auth URL (paste into authenticator app):\n${otpAuthUrl}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
