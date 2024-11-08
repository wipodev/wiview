import { exec } from "child_process";

export function preview(dir) {
  const servorProcess = exec(`servor ${dir} index.html --reload`);

  servorProcess.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  servorProcess.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  process.on("SIGINT", () => {
    console.log("\nClosing the server...");
    servorProcess.kill("SIGINT");
    process.exit();
  });
}
