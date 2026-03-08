import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";

const ROOT = process.cwd();
const PLAYWRIGHT_DIR = path.join(ROOT, "output", "playwright");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? ROOT,
      stdio: "pipe",
      shell: false,
      ...options
    });

    let stdout = "";
    let stderr = "";
    const timeoutMs = options.timeoutMs ?? 90000;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Command timed out: ${command} ${args.join(" ")}`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`Command failed: ${command} ${args.join(" ")}\n${stdout}\n${stderr}`));
    });
  });
}

function runPw(args) {
  if (process.platform === "win32") {
    const toBashPath = (value) =>
      value
        .replaceAll("\\", "/")
        .replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);
    const bashQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
    const scriptPath = "/mnt/c/Users/abida/.codex/skills/playwright/scripts/playwright_cli.sh";
    const command = `cd ${bashQuote(toBashPath(PLAYWRIGHT_DIR))} && ${bashQuote(scriptPath)} ${args.map((arg) => bashQuote(arg)).join(" ")}`;
    return run("bash", ["-lc", command], { cwd: ROOT });
  }

  return run("npx", ["--yes", "--package", "@playwright/cli", "playwright-cli", ...args], {
    cwd: PLAYWRIGHT_DIR
  });
}

function waitForServer(host, port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.on("timeout", () => socket.destroy());
      socket.on("error", () => socket.destroy());
      socket.on("close", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Timed out waiting for Astro dev server"));
          return;
        }
        setTimeout(tryConnect, 400);
      });
      socket.connect(port, host);
    };
    tryConnect();
  });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not resolve free port"));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function assertEval(expression, expected, message) {
  const { stdout } = await runPw(["eval", expression]);
  const resultMatch = stdout.match(/### result\s*([\s\S]*?)\n###/i);
  const rawResult = resultMatch ? resultMatch[1].trim() : stdout.trim();
  const actual = rawResult.toLowerCase();
  const expectedValue = String(expected).toLowerCase();
  if (actual !== expectedValue) {
    throw new Error(`${message}. Expected ${expectedValue}, received "${rawResult}"`);
  }
}

async function main() {
  await fs.mkdir(PLAYWRIGHT_DIR, { recursive: true });
  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const dev = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", `${port}`, "--strictPort"], {
    cwd: ROOT,
    stdio: "pipe",
    shell: true
  });

  let devLogs = "";
  dev.stdout.on("data", (chunk) => {
    devLogs += chunk.toString();
  });
  dev.stderr.on("data", (chunk) => {
    devLogs += chunk.toString();
  });

  try {
    await waitForServer("127.0.0.1", port, 45000);

    await runPw(["open", baseUrl]);
    await runPw(["snapshot"]);

    await assertEval("(function(){return document.body.innerText.includes('About');})()", true, "About section missing");
    await assertEval("(function(){return document.body.innerText.includes('Work');})()", true, "Work section missing");
    await assertEval("(function(){return document.body.innerText.includes('Studies');})()", true, "Studies section missing");
    await assertEval("(function(){return document.body.innerText.includes('Projects');})()", true, "Projects section missing");
    await assertEval("(function(){return document.body.innerText.includes('Certifications');})()", true, "Certifications section missing");
    await assertEval("(function(){return document.body.innerText.includes('Contact');})()", true, "Contact section missing");

    await runPw(["screenshot"]);

    await assertEval(
      "(function(){var t=document.querySelector('[data-toggle-theme]');if(!t){return false;}t.click();var theme=document.documentElement.getAttribute('data-theme');return ['abidlight','abiddark'].indexOf(theme)!==-1;})()",
      true,
      "Theme toggle check failed"
    );

    await runPw(["resize", "390", "844"]);
    await assertEval("(function(){return document.documentElement.scrollWidth<=window.innerWidth+1;})()", true, "Horizontal overflow detected on mobile");
    await runPw(["screenshot"]);

    await assertEval(
      "() => Array.from(document.querySelectorAll(\"a[href^='http']\")).every((el) => el.href.startsWith('http://') || el.href.startsWith('https://'))",
      true,
      "External link URL validation failed"
    );
  } finally {
    try {
      await runPw(["close"]);
    } catch {
      // ignore close errors
    }

    dev.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (!dev.killed) {
      dev.kill("SIGKILL");
    }

    await fs.writeFile(path.join(PLAYWRIGHT_DIR, "dev-server.log"), devLogs, "utf8");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
