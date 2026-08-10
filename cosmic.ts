/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// polyfill for the Cosmic desktop environment — https://system76.com/cosmic

import { watch } from "fs";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

enum ConfigApps {
    ThemeMode = "com.system76.CosmicTheme.Mode",
    ThemeDark = "com.system76.CosmicTheme.Dark",
    ThemeLight = "com.system76.CosmicTheme.Light"
}

function getConfigDir() {
    const config = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
    return join(config, "cosmic");
}

function parseKey(app: string, key: string, version = "v1") {
    return join(getConfigDir(), app, version, key);
}

async function getDarkThemePreference() {
    try {
        return Boolean(await readFile(parseKey(ConfigApps.ThemeDark, "is_dark"), "utf8"));
    } catch (error) {
        return true;
    }
}

export async function getCosmicAccentColor() {
    const dark = await getDarkThemePreference();
    const key = ConfigApps[dark ? "ThemeDark" : "ThemeLight"];

    try {
        const accent = await readFile(parseKey(key, "accent", "v2"), "utf8");
        const base = accent.match(/base: "(#[a-f0-9]+)"/i)?.[1];

        return base ? base.slice(0, 7).toLowerCase() : "";
    } catch (error) {
        return "";
    }
}

export function initCosmicListener(callback: () => void, signal: AbortSignal) {
    for (const key of [
        parseKey(ConfigApps.ThemeMode, "is_dark"),
        parseKey(ConfigApps.ThemeDark, "accent", "v2"),
        parseKey(ConfigApps.ThemeLight, "accent", "v2")
    ]) {
        // "On Linux and macOS systems, fs.watch() resolves the path to an inode and
        //  watches the inode. If the watched path is deleted and recreated, it is
        //  assigned a new inode. [...] Events for the new inode will not be emitted.
        //  This is expected behavior." — https://nodejs.org/docs/latest/api/fs.html#fs_caveats

        let watcher = watch(key, { signal, persistent: false }, function listener(event) {
            if (event === "rename") {
                watcher.close();
                watcher = watch(key, { signal, persistent: false }, listener);
            } else callback();
        });
    }
}
