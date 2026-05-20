/**
 * Synchronizes pi's active theme with the system theme using machfiles system-theme.
 *
 * This extension watches the system-theme file in machfiles, which is updated immediately
 * upon theme change by dark-mode-notify. 
 */
import { watch, type FSWatcher } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const SYSTEM_THEME_FILE = "/Users/jswent/machfiles/system-theme";

// Change these if you want to map system light/dark to custom pi theme names.
const PI_THEME_BY_SYSTEM_THEME = {
	light: "xcodelight",
	dark: "rose-pine",
} as const;

type SystemTheme = keyof typeof PI_THEME_BY_SYSTEM_THEME;

async function readSystemTheme(): Promise<SystemTheme | undefined> {
	try {
		const value = (await readFile(SYSTEM_THEME_FILE, "utf8")).trim().toLowerCase();
		if (value === "light" || value === "dark") return value;
	} catch {
		// File may not exist yet or may be mid-write. Ignore and retry on next event.
	}
	return undefined;
}

export default function (pi: ExtensionAPI) {
	let watcher: FSWatcher | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let currentPiTheme: string | undefined;
	let ctxRef: ExtensionContext | undefined;

	async function applyTheme(ctx: ExtensionContext, notify = false) {
		if (!ctx.hasUI) return;

		const systemTheme = await readSystemTheme();
		if (!systemTheme) return;

		const piTheme = PI_THEME_BY_SYSTEM_THEME[systemTheme];
		if (piTheme === currentPiTheme) return;

		const result = ctx.ui.setTheme(piTheme);
		if (!result.success) {
			ctx.ui.notify(`Failed to switch theme to ${piTheme}: ${result.error}`, "error");
			return;
		}

		currentPiTheme = piTheme;
		if (notify) ctx.ui.notify(`Theme synced to ${piTheme}`, "info");
	}

	function scheduleApply() {
		if (!ctxRef) return;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if (ctxRef) void applyTheme(ctxRef, true);
		}, 100);
	}

	pi.on("session_start", async (_event, ctx) => {
		ctxRef = ctx;
		await applyTheme(ctx);

		watcher?.close();
		watcher = watch(dirname(SYSTEM_THEME_FILE), (_eventType, filename) => {
			if (!filename || filename.toString() === basename(SYSTEM_THEME_FILE)) {
				scheduleApply();
			}
		});
	});

	pi.on("session_shutdown", () => {
		ctxRef = undefined;
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = undefined;
		}
		watcher?.close();
		watcher = undefined;
	});
}
