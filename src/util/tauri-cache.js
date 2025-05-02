let _TextEncoder;
if (typeof TextEncoder === 'undefined') {
    _TextEncoder = require('text-encoding').TextEncoder;
} else {
    /* global TextEncoder */
    _TextEncoder = TextEncoder;
}

class Cache {
    /**
     * Creates a new cache
     * @param {String} fileName The name of the file used for the cache
     */
    constructor(fileName) {
        this.file = fileName;
        this._data = {};

        this._attemptLoadData();
    }

    /**
     * Attempt to read from disk
     * @private
     */
    async _attemptLoadData() {
        const {exists, readTextFile, BaseDirectory} = window.__TAURI__.fs;

        const doesExist = await exists(this.file + '.cache', {
            baseDir: BaseDirectory.AppCache
        });

        if (!doesExist) return;

        const data = await readTextFile(this.file + '.cache', {
            baseDir: BaseDirectory.AppCache,
        });

        this._data = JSON.parse(data);
    }

    /**
     * Attempt to save to disk
     * @private
     */
    async _attemptSaveData() {
        const {exists, mkdir, create, writeTextFile, BaseDirectory} = window.__TAURI__.fs;

        const dirExists = await exists('./', {
            baseDir: BaseDirectory.AppCache
        });

        if (!dirExists) {
            await mkdir('./', {
                baseDir: BaseDirectory.AppCache
            });
        }

        const doesExist = await exists(this.file + '.cache', {
            baseDir: BaseDirectory.AppCache
        });

        if (doesExist) {
            const data = await writeTextFile('config.toml', JSON.stringify(this._data), {
                baseDir: BaseDirectory.AppConfig,
            });
        } else {
            const file = await create(this.file + '.cache', {
                baseDir: BaseDirectory.AppCache
            });
            
            await file.write(new _TextEncoder().encode(JSON.stringify(this._data)));
            await file.close();
        }
    }

    /**
     * Adds data to the cache, or updates the data if it is already there.
     * @param {String} first The key to store the data at.
     * @param {String} second The data to cache.
     */
    update(first, second) {
        this._data[first] = second;
        this._attemptSaveData();
    }

    /**
     * Gets data from the cache.
     * @param {String} first The key to get data from.
     * @returns 
     */
    get(first) {
        return this._data[first];
    }
}

module.exports = {
    ExtensionCache: new Cache('extension')
};
