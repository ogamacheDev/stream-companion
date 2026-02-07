import { execSync } from 'child_process';
import fs from 'fs';

const ext = '.exe';

const targetTriple = execSync('rustc --print host-tuple').toString().trim();
if (!targetTriple) {
    console.error('Failed to determine platform target triple');
}
// TODO: create `src-tauri/binaries` dir
fs.renameSync(
    `app.exe`,
    `../src-tauri/binaries/app-x86_64-pc-windows-msvc.exe`
);