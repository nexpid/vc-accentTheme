/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RendererSettings } from "@main/settings";
import { IpcMainInvokeEvent, systemPreferences } from "electron";

import { getCosmicAccentColor, initCosmicListener } from "./cosmic";

function settings() {
    return RendererSettings.store.plugins?.AccentTheme as {
        enabled: boolean;
        updateAutomatically: boolean;
        enableCosmicSupport: boolean;
    } | undefined;
}

export async function getColor() {
    const color = systemPreferences.getAccentColor().toLowerCase();
    const hex = color.replace("#", "").slice(0, 6);

    if (!hex && settings()?.enableCosmicSupport) return await getCosmicAccentColor();
    return hex ? `#${hex}` : "";
}

let controller: AbortController | undefined;
export function initListener(event: IpcMainInvokeEvent) {
    controller?.abort();
    controller = new AbortController();

    let dedupedColor: string | undefined;
    async function listener() {
        const color = await getColor();
        if (!color || !settings()?.updateAutomatically) return;

        if (dedupedColor !== color)
            event.sender.executeJavaScript(`Vencord.Plugins.plugins.AccentTheme.updateColor(${JSON.stringify(color)})`);
        dedupedColor = color;
    }

    systemPreferences.on("accent-color-changed", listener);
    controller.signal.addEventListener("abort", () => systemPreferences.off("accent-color-changed", listener));

    initCosmicListener(() => settings()?.enableCosmicSupport && listener(), controller.signal);
}
export function stopListener() {
    controller?.abort();
}
