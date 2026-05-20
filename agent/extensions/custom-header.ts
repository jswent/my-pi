/**
 * Custom Header Extension
 *
 * Demonstrates ctx.ui.setHeader() for replacing the built-in header
 * (logo + keybinding hints) with a custom component showing a block logo.
 */

import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { VERSION } from "@earendil-works/pi-coding-agent";

function getCustomLogo(theme: Theme): string[] {
	const logo = (text: string) => theme.fg("accent", text);
	const BLOCK = "█";
	const cell = BLOCK.repeat(2);
	const gap = " ".repeat(2);

	const rows = [
		[cell, cell, cell, gap],
		[cell, gap, cell, gap],
		[cell, cell, gap, cell],
		[cell, gap, gap, cell],
	];

	return rows.map((row) => logo(`  ${row.join("")}`));
}

export default function (pi: ExtensionAPI) {
	// Set custom header immediately on load (if UI is available)
	pi.on("session_start", async (_event, ctx) => {
		if (ctx.hasUI) {
			ctx.ui.setHeader((_tui, theme) => {
				return {
					render(_width: number): string[] {
						const logoLines = getCustomLogo(theme);
						const spacer = "   ";
						const title = `${theme.fg("borderAccent", "Pi")} ${theme.fg("dim", "·")} ${theme.fg("muted", "shitty coding agent")}`;
						const version = theme.fg("dim", `v${VERSION}`);

						return [
							"",
							`${logoLines[0]}${spacer}`,
							`${logoLines[1]}${spacer}${title}`,
							`${logoLines[2]}${spacer}${version}`,
							`${logoLines[3]}${spacer}`,
							"",
						];
					},
					invalidate() {},
				};
			});
		}
	});

	// Command to restore built-in header
	// pi.registerCommand("builtin-header", {
	// 	description: "Restore built-in header with keybinding hints",
	// 	handler: async (_args, ctx) => {
	// 		ctx.ui.setHeader(undefined);
	// 		ctx.ui.notify("Built-in header restored", "info");
	// 	},
	// });
}
