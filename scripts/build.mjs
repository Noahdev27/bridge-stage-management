// Build de production : migrations Prisma puis `next build`.
//
// Vercel garde Turbopack (le défaut de Next 16). Ailleurs (Hostinger…), on force
// webpack : Turbopack évalue PostCSS dans un process Node enfant que certains
// hébergeurs terminent avant qu'il se connecte, ce qui fait échouer le build sur
// `globals.css`. Webpack traite le CSS dans le process principal.
import { spawnSync } from "node:child_process";

const run = (command) => {
  const { status } = spawnSync(command, { stdio: "inherit", shell: true });
  if (status !== 0) process.exit(status ?? 1);
};

const bundler = process.env.VERCEL ? "" : " --webpack";

run("npx prisma migrate deploy");
run(`npx next build${bundler}`);
