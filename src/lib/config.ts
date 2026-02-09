import {BaseDirectory, exists, mkdir, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";

interface Config {
    context: string
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

    await writeTextFile('config.json', JSON.stringify(config), {
        baseDir: BaseDirectory.AppData
    });
}

const fetch: () => Promise<Config> = async () => {
    const configFile = await exists('config.json', { baseDir: BaseDirectory.AppConfig })
    if (!configFile) {
        return { error: true }
    }
    const config = await readTextFile("config.json", {
        baseDir: BaseDirectory.AppData
    })
    if (config) {
        return JSON.parse(config);
    }
    return { error: true }
}

export { save, fetch };
export type { Config };