import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptsDir, "..");
const isWindows = process.platform === "win32";

const child = isWindows
  ? spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(scriptsDir, "start.ps1"),
      ],
      { cwd: rootDir, stdio: "inherit" },
    )
  : spawn("bash", [path.join(scriptsDir, "start.sh")], {
      cwd: rootDir,
      stdio: "inherit",
    });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
