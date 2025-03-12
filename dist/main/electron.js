"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const mainPath = path_1.default.join(__dirname, "dist", "electron", "main.js");
(0, child_process_1.spawn)("electron", [mainPath], {
    stdio: "inherit",
    shell: true,
});
