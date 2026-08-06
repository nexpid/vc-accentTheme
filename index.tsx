/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import definePlugin, { OptionType, PluginNative } from "@utils/types";
import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { showToast, UserSettingsProtoStore } from "@webpack/common";

const Native = VencordNative.pluginHelpers.AccentTheme as PluginNative<typeof import("./native")>;

const updateTheme = findByCodeLazy('type:"SELECTIVELY_SYNCED_USER_SETTINGS_UPDATE",');
const chroma = findByPropsLazy("Color");

const darkenThreshold = 0.2;
function updateColor(color: string, live?: boolean) {
    if (live && !settings.store.updateAutomatically) return;

    const { appearance } = UserSettingsProtoStore.settings;
    const themeSettings = appearance.clientThemeSettings?.customUserThemeSettings;

    const base = chroma(color);
    const tinted = base.luminance() >= darkenThreshold ? base.darken() : base.brighten();

    updateTheme({
        theme: appearance.theme === 2 ? "light" : "dark",
        customUserThemeSettings: {
            colors: [
                base.hex(),
                tinted.hex()
            ],
            gradientAngle: themeSettings?.gradientAngle ?? 0,
            baseMix: themeSettings?.baseMix ?? 80,
        }
    });
}

const settings = definePluginSettings({
    updateAutomatically: {
        type: OptionType.BOOLEAN,
        description: "Automatically updates your theme when your accent color changes",
        default: true,
    },
    updateOnStartup: {
        type: OptionType.BOOLEAN,
        description: "Updates your theme upon restart",
        default: false,
    },
    update: {
        type: OptionType.COMPONENT,
        component: () => <Button onClick={async () => {
            updateColor(await Native.getColor());
            showToast("Updated theme!");
        }}>
            Update theme
        </Button>,
    },
});

export default definePlugin({
    name: "AccentTheme",
    description: "Syncs Discord's appearance with your desktop",
    tags: ["Appearance", "Customisation"],
    authors: [{
        name: "nexpid",
        id: 853550207039832084n
    }],
    settings,
    updateColor,
    async start() {
        Native.initAccentThemeListener();
        if (settings.store.updateOnStartup) this.updateColor(await Native.getColor());
    }
});
