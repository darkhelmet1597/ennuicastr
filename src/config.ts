/*
 * Copyright (c) 2018-2020 Yahweasel
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

import { prot } from "./protocol";
import { dce, gebi } from "./util";

/* These are the features selectable in the URL, not (necessarily) the
 * protocol */
var featuresMask = 0xF;
export var features = {
    "continuous": 0x1,
    "rtc": 0x2
};

// Configuration parameters come out of the URL search query
export var url = new URL(<any> window.location);
var params = new URLSearchParams(url.search);

// Convert short-form configuration into long-form
var shortForm: null|string = null;
Array.from((<any> params).entries()).forEach(function(key: string) {
    key = key[0];
    if (/-/.test(key))
        shortForm = key;
});

if (shortForm) {
    var sfParts = shortForm.split("-");
    params.set("i", sfParts[0]);
    params.set("k", sfParts[1]);
    sfParts.slice(2).forEach(function(part) {
        params.set(part[0], part.slice(1));
    });
    params.delete(shortForm);
}

// Get our target for initial login
var preEc = gebi("pre-ec");
var loginTarget = gebi("login-ec") || document.body;

// Read in our configuration
export var config: any = {
    id: params.get("i"),
    key: params.get("k"),
    format: params.get("f"),
    port: params.get("p")
};
var master = params.get("m");
var selector = params.get("s");
var monitor = params.get("mon");
export var username = params.get("nm");
if (config.id === null) {
    // Redirect to the homepage
    window.location = <any> "/home/";
    throw new Error;
}
config.id = Number.parseInt(config.id, 36);
if (config.key === null) {
    var div = dce("div");
    div.innerHTML = "Invalid key!";
    loginTarget.appendChild(div);
    if (preEc) preEc.style.display = "";
    throw new Error;
}
config.key = Number.parseInt(config.key, 36);
if (master !== null)
    config.master = Number.parseInt(master, 36);
if (config.port === null)
    config.port = 36678;
else
    config.port = Number.parseInt(config.port, 36);
if (config.format === null)
    config.format = 0;
config.format = Number.parseInt(config.format, 36);

// If we're using the selector, just do that
if (selector) {
    var div = dce("div");
    div.innerText = "Client links:";
    loginTarget.appendChild(div);
    if (preEc) preEc.style.display = "";

    var sb = "?i=" + config.id.toString(36) + "&k=" + config.key.toString(36) + "&p=" + config.port.toString(36);

    for (var opt = 0; opt <= config.format; opt++) {
        if ((opt&config.format)!==opt) continue;
        // We don't let the menu decide to just not use WebRTC communication
        if ((opt&features.rtc)!==(config.format&features.rtc)) continue;

        div = dce("div");
        var a = dce("a");
        if (opt === 0)
            url.search = sb;
        else
            url.search = sb + "&f=" + opt.toString(36);
        a.href = url.toString();

        a.innerText = (((opt&prot.flags.dataTypeMask)===prot.flags.dataType.flac) ? "FLAC" : "Opus") +
            ((opt&features.continuous)?" continuous":"");

        div.appendChild(a);
        loginTarget.appendChild(div);
    }

    throw new Error;
}

// If we're looking for the monitor, just do that
if (monitor) {
    var scr = dce("script");
    scr.src = "ennuicastr-monitor.js?v=1";
    scr.async = true;
    loginTarget.appendChild(scr);
    if (preEc) preEc.style.display = "";
    throw new Error;
}

// Hide the extraneous details
url.search = "?i=" + config.id.toString(36);
window.history.pushState({}, "Ennuicastr", url.toString());

// Next, check if we have a username
if (username === null || username === "") {
    // Just ask for a username
    var div = dce("div");
    var span = dce("span");
    span.innerHTML = "You have been invited to join a recording on Ennuicastr. Please enter a username.<br/><br/>";
    div.appendChild(span);
    var form = dce("form");
    form.action = "?";
    form.method = "GET";
    var def = "";
    if (typeof localStorage !== "undefined")
        def = localStorage.getItem("username") || "";
    def = def.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    var html =
        "<label for=\"nm\">Username: </label><input name=\"nm\" id=\"nm\" type=\"text\" value=\"" + def + "\" /> ";
    for (var key in config)
        html += "<input name=\"" + key[0] + "\" type=\"hidden\" value=\"" + config[key].toString(36) + "\" />";
    html += "<input type=\"submit\" value=\"Join\" />";
    form.innerHTML = html;

    form.onsubmit = function(ev: Event) {
        // Try to do this in a new window
        var target = "?";
        for (var key in config)
            target += key[0] + "=" + config[key].toString(36) + "&";
        target += "nm=" + encodeURIComponent(gebi("nm").value);
        var height = ("master" in config)?480:240;
        if (window.open(target, "", "width=640,height=" + height + ",menubar=0,toolbar=0,location=0,personalbar=0,status=0") === null) {
            // Just use the regular submit
            return true;
        }

        div.innerHTML = "Connecting in a new window. You may now close this tab.";

        ev.preventDefault();
        return false;
    };

    div.appendChild(form);
    loginTarget.appendChild(div);
    if (preEc) preEc.style.display = "";

    var nmBox = gebi("nm");
    nmBox.focus();
    nmBox.select();

    throw new Error;

} else {
    // Remember the username
    if (typeof localStorage !== "undefined")
        localStorage.setItem("username", username);

}

// Find the websock URL
export const wsUrl = (url.protocol==="http:"?"ws":"wss") + "://" + url.hostname + ":" + config.port;

// Should we be creating FLAC?
export const useFlac = ((config.format&prot.flags.dataTypeMask) === prot.flags.dataType.flac);

// Which features to use
export const useContinuous = !!(config.format&features.continuous);
export const useRTC = !!(config.format&features.rtc);

// Color sets for wave vad colors
const waveVADColorSets = {
    "sv": ["#000", "#753", "#730", "#a30"],
    "sc": ["#000", "#730", "#730", "#a30"],
    "rv": ["#000", "#aaa", "#073", "#0a3"],
    "rc": ["#000", "#073", "#073", "#0a3"]
};

// And the current colors
export var waveVADColors = waveVADColorSets.sv;
export function setWaveVADColors(to: string) { waveVADColors = (<any> waveVADColorSets)[to]; }

// If we're in continuous mode, we don't distinguish the degrees of VAD
if (useContinuous) waveVADColors = waveVADColorSets.sc;
