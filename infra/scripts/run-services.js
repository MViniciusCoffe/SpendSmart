const { spawn, execSync } = require("child_process");

function runCommand(command) {
  console.log(`\nExecutando: ${command}`);
  execSync(command, { stdio: "inherit" });
}

let isCleaningUp = false;

function cleanup() {
  if (isCleaningUp) {
    return;
  }

  isCleaningUp = true;
  console.log("\nEncerrando ambiente de desenvolvimento...");

  try {
    runCommand("npm run services:stop");
  } catch (error) {
    console.error(`Falha ao encerrar os servicos: ${error.message}`);
  }
}

function handleShutdown() {
  cleanup();
  process.exit();
}

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

try {
  runCommand("npm run services:up");
  runCommand("npm run services:wait:database");

  console.log("\nIniciando Next.js...");
  const nextDev = spawn("npm", ["run", "next:dev"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  nextDev.on("close", (code) => {
    if (code !== 0) {
      console.log(`Next.js encerrou com codigo ${code}.`);
    }
    cleanup();
  });
} catch (error) {
  console.error(`\nFalha ao iniciar o ambiente: ${error.message}`);
  cleanup();
  process.exit(1);
}
