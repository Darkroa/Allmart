import { db, usersTable, productsTable, ordersTable } from "@workspace/db";
import fs from "fs";
import path from "path";

const OUT_DIR = process.env.BACKUP_DIR ?? "./backups";

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(OUT_DIR, `backup-${timestamp}.json`);

  const [users, products, orders] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(productsTable),
    db.select().from(ordersTable),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    counts: { users: users.length, products: products.length, orders: orders.length },
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      tier: u.tier,
      createdAt: u.createdAt,
    })),
    products,
    orders,
  };

  fs.writeFileSync(file, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup saved: ${file}`);
  console.log(`   Users: ${users.length} | Products: ${products.length} | Orders: ${orders.length}`);
  process.exit(0);
}

main().catch(err => {
  console.error("Backup failed:", err);
  process.exit(1);
});
