import "dotenv/config";
import { seedAdmin } from "../src/modules/admin-auth/admin-auth.service";
import { authenticator } from "otplib";
import qrcode from "qrcode-terminal";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@venlaxiq.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123!";

  const totpSecret = await seedAdmin(email, password);
  const otpAuthUrl = authenticator.keyuri(email, "VenlaxIQ Admin", totpSecret);

  console.log("\n=== Admin user created ===");
  console.log(`Email:       ${email}`);
  console.log(`TOTP secret: ${totpSecret}`);
  console.log("\nScan this QR code with your authenticator app:\n");
  qrcode.generate(otpAuthUrl, { small: true });
  console.log("\nAdd TOTP secret to your authenticator app manually if QR scan fails.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
