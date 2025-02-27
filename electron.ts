import { spawn } from "child_process";
import path from "path";

const mainPath = path.join(__dirname, "dist", "electron", "main.js");

spawn("electron", [mainPath], {
  stdio: "inherit",
  shell: true,
});
