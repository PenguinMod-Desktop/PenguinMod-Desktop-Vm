// This will only work in PenguinMod Desktop, any projects using this can not be loaded in pm.

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require("../../extension-support/block-type");

/**
 * Parse a URL object or return null.
 * @param {string} url The url to parse.
 * @returns {URL|null} Returns the parsed url, or null if we failed to parse the url.
 */
const parseURL = url => {
    try {
        return new URL(url, location.href);
    } catch (e) {
        return null;
    }
};

/**
 * Legal characters for the unique ID.
 * Should be all on a US keyboard.  No XML special characters or control codes.
 * No symbols allowed, must be alphanumeric: `a-zA-Z-/:_`
 * @private
 */
const soup_ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a unique ID
 * @returns {string} A globally unique ID string.
 */
const uid = function () {
    const length = 20;
    const soupLength = soup_.length;
    const id = [];
    for (let i = 0; i < length; i++) {
        id[i] = soup_.charAt(Math.random() * soupLength);
    }
    return id.join('');
};

class TauriWebview {
    constructor(runtime) {
        this.securityManager = runtime.vm.securityManager;
    }

    getInfo() {
        return {
            id: 'tauriWebview',
            name: 'Webview Window',
            color1: '#4C98E4',
            blocks: [
                {
                    blockType: BlockType.LABEL,
                    text: 'Windows'
                },
                {
                    opcode: 'open',
                    blockType: BlockType.COMMAND,
                    text: 'open a window titled [TITLE] at [URL]',
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://google.com'
                        },
                        TITLE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'New Window'
                        }
                    }
                },
                {
                    opcode: 'openWithSize',
                    blockType: BlockType.COMMAND,
                    text: 'open a window titled [TITLE] at [URL] with width [WIDTH] and height [HEIGHT]',
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://google.com'
                        },
                        TITLE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'New Window'
                        },
                        WIDTH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1440
                        },
                        HEIGHT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 810
                        }
                    }
                }
            ]
        };
    }

    hasTauri() {
        return '__TAURI__' in window;
    }

    async requestPermission(url) {
        const parsed = parseURL(url);
        if (!parsed) {
            return false;
        }
        // Always reject protocols that would allow code execution.
        // eslint-disable-next-line no-script-url
        if (parsed.protocol === 'javascript:') {
            return false;
        }
        return await this.securityManager.canOpenWindow(parsed.href);
    }

    async open({ URL, TITLE }) {
        await this.openWithSize({ URL, TITLE, WIDTH: 1440, HEIGHT: 810 });
    }

    async openWithSize({ URL, TITLE, WIDTH, HEIGHT }) {
        if (!this.hasTauri()) throw new Error("Could not find the tauri api!");
        if (!(await this.requestPermission(URL))) throw new Error("Permission to open the site was denied!");
        
        // Open a new webview with default permissions
        
        const TAURI = window.__TAURI__;
        const WebviewWindow = TAURI.webviewWindow.WebviewWindow;

        const _ = new WebviewWindow(`project-${uid()}`, {
            url: URL,
            title: TITLE,
            focus: true,

            height: HEIGHT,
            width: WIDTH
        });
    }
}

module.exports = TauriWebview;
