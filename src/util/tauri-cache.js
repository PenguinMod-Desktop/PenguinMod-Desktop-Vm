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
     * 
     * @param {string} fileName the name of the file used for the cache
     */
    constructor(fileName) {
        this.file = fileName;
        this._data = {};

        this._promise = this._attemptLoadData();
    }

    /**
     * Attempt to read from disk.
     * 
     * @private
     */
    async _attemptLoadData() {
        const {exists, readTextFile, BaseDirectory} = window.__TAURI__.fs;

        const doesExist = await exists(this.file + '.cache', {
            baseDir: BaseDirectory.AppCache
        });

        if (!doesExist) return;

        const data = await readTextFile(this.file + '.cache', {
            baseDir: BaseDirectory.AppCache
        });

        this._data = JSON.parse(data);
    }

    /**
     * Attempt to save to disk.
     * 
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
            await writeTextFile(this.file + '.cache', JSON.stringify(this._data), {
                baseDir: BaseDirectory.AppCache
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
     * 
     * @param {string} first the key to store the data at
     * @param {string} second the data to cache
     */
    async update(first, second) {
        this._data[first] = second;
        await this._attemptSaveData();
    }

    /**
     * Gets data from the cache.
     * 
     * @param {string} key the key to get data from
     * @returns {string} the cached data
     */
    async get(key) {
        await this._promise; // Ensure loaded.
        return this._data[key];
    }
}

module.exports = {
    ExtensionCache: new Cache('extension')
};
