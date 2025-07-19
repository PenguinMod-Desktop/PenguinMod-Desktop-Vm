// This will only work in PenguinMod Desktop, any projects using this can not be loaded in pm.

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require("../../extension-support/block-type");

const BlockShape = require("../../extension-support/block-shape");

/**
 * Checks if the global tauri API exists.
 * @returns {boolean} true if global tauri exists, false overwise.
 */
const hasTauri = () => '__TAURI__' in window;

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

class Window {
    constructor(webviewWindow) {
        if (!hasTauri()) throw new Error("Could not find the tauri api!");

        const TAURI = window.__TAURI__;
        const WebviewWindow = TAURI.webviewWindow.WebviewWindow;

        if (!(webviewWindow instanceof WebviewWindow)) throw new Error('Invalid window.');

        this.__access__ = webviewWindow;

        this.open = true;
        this.__access__.onCloseRequested(() => {
            this.open = false;
        });
    }

    /**
     * Checks if the object is a window
     * @param {object} window The (possible) window
     * @returns {boolean} Returns true if the input was a window.
     */
    static is(window) {
        return window instanceof Window;
    }
    static new(label, options) {
        if (!hasTauri()) throw new Error("Could not find the tauri api!");

        const TAURI = window.__TAURI__;
        const WebviewWindow = TAURI.webviewWindow.WebviewWindow;

        const webviewWindow = new WebviewWindow(label, options);
        return new Window(webviewWindow);
    }
    static existing(window) {
        if (!hasTauri()) throw new Error("Could not find the tauri api!");

        return new Window(window);
    }

    toString() {
        return '<WebviewWindow>';
    }
}

class TauriWebview {
    constructor(runtime) {
        this.securityManager = runtime.vm.securityManager;

        if (!hasTauri()) throw new Error("Could not find the tauri api!");

        const TAURI = window.__TAURI__;
        const currentWindow = TAURI.webviewWindow.getCurrentWebviewWindow();

        this.currentWindow = Window.existing(currentWindow);
    }

    getInfo() {
        return {
            id: 'tauriWebview',
            name: 'Webview Window',
            color1: '#4C98E4',
            blocks: [
                {
                    opcode: 'open',
                    blockType: BlockType.COMMAND,
                    text: 'open a window titled [TITLE] at [URL] and [WAIT] until closed',
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://google.com'
                        },
                        TITLE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'New Window'
                        },
                        WAIT: {
                            type: ArgumentType.STRING,
                            menu: 'WAIT'
                        }
                    }
                },
                {
                    opcode: 'openWithSize',
                    blockType: BlockType.COMMAND,
                    text: 'open a window titled [TITLE] at [URL] with width [WIDTH] height [HEIGHT]'
                        + ' and [WAIT] until closed',
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
                        },
                        WAIT: {
                            type: ArgumentType.STRING,
                            menu: 'WAIT'
                        }
                    }
                },
                {
                    opcode: 'openReporter',
                    blockType: BlockType.REPORTER,
                    blockShape: BlockShape.SQUARE,
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
                    opcode: 'openWithSizeReporter',
                    blockType: BlockType.REPORTER,
                    blockShape: BlockShape.SQUARE,
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
                },
                "---",
                {
                    opcode: 'getCurrentWindow',
                    blockType: BlockType.REPORTER,
                    text: 'get current window',
                    disableMonitor: true
                },
                "---",
                {
                    opcode: 'is',
                    blockType: BlockType.BOOLEAN,
                    text: 'is [WINDOW] [OPT]?',
                    arguments: {
                        WINDOW: {
                            exemptFromNormalization: true
                        },
                        OPT: {
                            type: ArgumentType.STRING,
                            menu: 'IS_OPT'
                        }
                    }
                },
                {
                    opcode: 'close',
                    blockType: BlockType.COMMAND,
                    text: 'close [WINDOW]',
                    arguments: {
                        WINDOW: {
                            exemptFromNormalization: true
                        }
                    }
                }
            ],
            menus: {
                WAIT: {
                    acceptReporters: false,
                    items: ["don't wait", "wait"]
                },
                IS_OPT: {
                    acceptReporters: true,
                    items: ["open", "focused"]
                }
            }
        };
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

    /**
     * Opens a window with the specified url, title, width, and height.
     * @param {string} url URL to be opened.
     * @param {string} title Title of the new window.
     * @param {number} width Width of the new window.
     * @param {number} height Height of the new window.
     * @param {"don't wait" | "wait"} wait Whether or not to wait until the window has closed.
     * @returns {Promise<Window>} Returns the window which was opened.
     */
    async _open(url, title, width, height, wait) {
        return new Promise(async (resolve, reject) => {
            if (!hasTauri()) return reject("Could not find the tauri api!");
            if (!(await this.requestPermission(url))) return reject("Permission to open the site was denied!");
        
            // Open a new webview with default permissions

            const label = `project-${uid()}`;

            const newWindow = Window.new(label, {
                url: url,
                title: title,
                focus: true,

                height: height,
                width: width
            });

            if (wait === "don't wait") {
                resolve(newWindow);
                return;
            }

            // Listen for window closed event
            const unlisten = await newWindow.window.onCloseRequested(() => {
                unlisten();
                resolve(newWindow); 
            });
        });
    }

    /**
     * Opens a window with the specified url and title.
     * @param {*} param0 The block's arguments.
     */
    async open({ URL, TITLE, WAIT }) {
        await this._open(URL, TITLE, 1440, 810, WAIT);
    }

    /**
     * Opens a window with the specified url, title, width, and height.
     * @param {*} param0 The block's arguments
     */
    async openWithSize({ URL, TITLE, WIDTH, HEIGHT, WAIT }) {
        await this._open(URL, TITLE, WIDTH, HEIGHT, WAIT);
    }

    /**
     * Opens a window with the specified url and title.
     * @param {*} param0 The block's arguments.
     * @returns {Promise<Window>} Returns the window which was opened.
     */
    async openReporter({ URL, TITLE }) {
        return await this._open(URL, TITLE, 1440, 810, "don't wait");
    }

    /**
     * Opens a window with the specified url, title, width, and height.
     * @param {*} param0 The block's arguments
     * @returns {Promise<Window>} Returns the window which was opened.
     */
    async openWithSizeReporter({ URL, TITLE, WIDTH, HEIGHT }) {
        return await this._open(URL, TITLE, WIDTH, HEIGHT, "don't wait");
    }

    /**
     * Returns the current window
     * @returns {Window} The current window
     */
    getCurrentWindow() {
        return this.currentWindow;
    }

    /**
     * Checks a window's properties based on the specified OPT
     * @param {*} param0 The block's arguments
     * @returns {boolean} Whether or not all checks where passed successfully.
     */
    is({ WINDOW, OPT }) {
        if (!Window.is(WINDOW)) return false;

        switch (OPT) {
        case 'open': {
            return WINDOW.open;
        }
        case 'focused': {
            return WINDOW.__access__.isFocused();
        }
        default: {
            return false;
        }
        }
    }

    /**
     * Closes the window
     * @param {*} param0 The block's arguments 
     */
    close({ WINDOW }) {
        if (Window.is(WINDOW))
            WINDOW.__access__.close();
    }
}

module.exports = TauriWebview;
