import {BaseDirectory, exists, mkdir, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";

interface Config {
    context: string
}

const defaultConfig: Config = {
    context: ""
}

const save = async (config: Config) => {
    const folderExists = await exists('', {
        baseDir: BaseDirectory.AppData
    })
    if (!folderExists) {
        await mkdir('', {
            baseDir: BaseDirectory.AppData
        })
    }

    await writeTextFile('config.json', JSON.stringify(config, null, 2), {
        baseDir: BaseDirectory.AppData
    });
}

const fetch: () => Promise<Config> = async () => {
    const folderExists = await exists('', {
        baseDir: BaseDirectory.AppData
    })
    if (!folderExists) {
        await mkdir('', {
            baseDir: BaseDirectory.AppData
        })
    }

    const fileExists = await exists('config.json', {
        baseDir: BaseDirectory.AppData
    })
    if (!fileExists) {
        await writeTextFile('config.json', JSON.stringify(defaultConfig, null, 2), {
            baseDir: BaseDirectory.AppData
        });

        return defaultConfig;
    }

    const config = await readTextFile("config.json", {
        baseDir: BaseDirectory.AppData
    })

    try {
        return JSON.parse(config);
    } catch {
        console.log("Failed to parse config, returning default config.");
        return defaultConfig;
    }
}

export { save, fetch };
export type { Config };