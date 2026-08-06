/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent, systemPreferences } from "electron";

export function getColor() {
    const color = systemPreferences.getAccentColor().toLowerCase();
    return `#${color.slice(0, 6)}`;
}

export function initAccentThemeListener(event: IpcMainInvokeEvent) {

    let lastChange: string | undefined;
    systemPreferences.on("accent-color-changed", () => {
        // electron fires the event multiple times, which is why we have to dedupe it
        const color = getColor();
        if (lastChange === color) return;

        event.sender.executeJavaScript(`Vencord.Plugins.plugins.AccentTheme.updateColor(${JSON.stringify(color)}, true)`);
        lastChange = color;
    });
}
