/*
 * Copyright (c) 2020 Yahweasel
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// Push to talk

// extern
declare var ECHotkeys: any;

import * as audio from "./audio";
import * as ui from "./ui";

// PTT settings
const ptt = {
    hotkey: <null|string> null
};

// Configure push-to-talk based on saved settings
export function loadPTT() {
    configurePTT(localStorage.getItem("ec-ptt"));
}

// Configure push-to-talk based on the given hotkey
function configurePTT(hotkey: null|string) {
    ptt.hotkey = hotkey;

    // Remove any previously enabled event listeners
    document.body.removeEventListener("keydown", pttDown);
    document.body.removeEventListener("keyup", pttUp);

    if (hotkey) {
        // Push-to-talk enabled
        audio.toggleMute(false);
        document.body.addEventListener("keydown", pttDown);
        document.body.addEventListener("keyup", pttUp);
        localStorage.setItem("ec-ptt", hotkey);

    } else {
        // Push-to-talk disabled
        audio.toggleMute(true);
        localStorage.removeItem("ec-ptt");

    }
}

// Configure push-to-talk based on user selection
export function userConfigurePTT() {
    if (typeof ECHotkeys === "undefined")
        return;
    return ECHotkeys.getUserKey().then(function(key: {key: string}) {
        if (key) {
            if (/^eb:/.test(key.key))
                configurePTT(key.key);
            else
                return userConfigurePTT();
        } else {
            configurePTT(null);
        }
    });
}

// PTT key pressed
function pttDown(ev: KeyboardEvent) {
    if (ev.key !== ptt.hotkey)
        return;
    audio.toggleMute(true);
}

// PTT key depressed
function pttUp(ev: KeyboardEvent) {
    if (ev.key !== ptt.hotkey)
        return;
    audio.toggleMute(false);
}
