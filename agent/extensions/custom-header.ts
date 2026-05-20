/**
 * Custom Header Extension
 *
 * Demonstrates ctx.ui.setHeader() for replacing the built-in header
 * (logo + keybinding hints) with a custom component showing a block logo.
 */

import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { VERSION } from "@earendil-works/pi-coding-agent";

// --- CUSTOM LOGO ---
// Block-glyph version of the logo from the provided image.
function getCustomLogo(theme: Theme): string[] {
	const logo = (text: string) => theme.fg("accent", text);
	const BLOCK = "█";
	const cell = BLOCK.repeat(4);
	const gap = " ".repeat(4);

	// Scaled from this 4x4 block pattern:
	// [block][block][block][space]
	// [block][space][block][space]
	// [block][block][space][block]
	// [block][space][space][block]
	const rows = [
		[cell, cell, cell, gap],
		[cell, gap, cell, gap],
		[cell, cell, gap, cell],
		[cell, gap, gap, cell],
	];

	return [
		"",
		...rows.flatMap((row) => {
			const line = logo(`  ${row.join("")}`);
			return [line, line];
		}),
		"",
	];
}

export default function (pi: ExtensionAPI) {
	// Set custom header immediately on load (if UI is available)
	pi.on("session_start", async (_event, ctx) => {
		if (ctx.hasUI) {
			ctx.ui.setHeader((_tui, theme) => {
				return {
					render(_width: number): string[] {
						const logoLines = getCustomLogo(theme);
						// Add a subtitle with hint
						const subtitle = `${theme.fg("muted", "   shitty coding agent")}${theme.fg("dim", ` v${VERSION}`)}`;
						return [...logoLines, subtitle];
					},
					invalidate() {},
				};
			});
		}
	});

	// Command to restore built-in header
	pi.registerCommand("builtin-header", {
		description: "Restore built-in header with keybinding hints",
		handler: async (_args, ctx) => {
			ctx.ui.setHeader(undefined);
			ctx.ui.notify("Built-in header restored", "info");
		},
	});
}
