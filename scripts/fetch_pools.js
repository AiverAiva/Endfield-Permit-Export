const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.join(__dirname, '..', 'static');
const CHECKPOINT_FILE = path.join(STATIC_DIR, 'checkpoint.txt');

const CONTENT_API = 'https://ef-webview.gryphline.com/api/content';

// Rerun pool IDs use the character asset suffix: rerun_chr_yvonne / rerun_wpn_yvonne.
const KNOWN_RERUN_SUFFIXES = ['yvonne'];
const SKIP_SUFFIXES = new Set(['endmin', 'endminm', 'endminf']);

async function fetchPoolById(poolId) {
    const url = `${CONTENT_API}?lang=zh-tw&pool_id=${poolId}&server_id=2`;
    console.log(`Fetching ${url}`);
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 0 && data.data && data.data.pool) {
        return data;
    }
    return null;
}

async function fetchPool(type, id) {
    return fetchPoolById(`${type}_${id}`);
}

function parseId(idStr) {
    const parts = idStr.split('_').map(Number);
    return { x: parts[0], y: parts[1], z: parts[2] };
}

function formatId(x, y, z) {
    return `${x}_${y}_${z}`;
}

function suffixFromCharId(charId) {
    if (!charId || !charId.startsWith('chr_')) return null;
    const parts = charId.split('_');
    if (parts.length < 3) return null;
    const suffix = parts.slice(2).join('_');
    if (!suffix || SKIP_SUFFIXES.has(suffix)) return null;
    return suffix;
}

function collectRerunSuffixes() {
    const suffixes = new Set(KNOWN_RERUN_SUFFIXES);

    if (fs.existsSync(STATIC_DIR)) {
        const specialFiles = fs.readdirSync(STATIC_DIR).filter(
            (f) => f.startsWith('special_') && f.endsWith('.json'),
        );
        for (const file of specialFiles) {
            try {
                const data = JSON.parse(
                    fs.readFileSync(path.join(STATIC_DIR, file), 'utf-8'),
                );
                const all = data?.data?.pool?.all || [];
                const up = all.find((c) => c && c.rarity === 6 && c.id);
                const suffix = suffixFromCharId(up && up.id);
                if (suffix) suffixes.add(suffix);
            } catch (err) {
                console.warn(`Failed to read ${file}: ${err.message}`);
            }
        }
    }

    return suffixes;
}

async function fetchNumberedCheckpoint() {
    let checkpointVal = '1_1_2';
    if (fs.existsSync(CHECKPOINT_FILE)) {
        const fileContent = fs.readFileSync(CHECKPOINT_FILE, 'utf-8').trim();
        if (fileContent) {
            checkpointVal = fileContent;
        }
    }

    let { x, y, z } = parseId(checkpointVal);

    // Check current checkpoint
    let currentId = formatId(x, y, z);
    let specialData = await fetchPool('special', currentId);

    if (specialData) {
        console.log(`Found pool for checkpoint ${currentId}, saving.`);
    } else {
        console.log(`Pool ${currentId} not found, trying ${formatId(x, y, z + 1)}`);
        currentId = formatId(x, y, z + 1);
        specialData = await fetchPool('special', currentId);

        if (specialData) {
            console.log(`Found pool ${currentId}, updating checkpoint.`);
            z = z + 1;
        } else {
            console.log(`Pool ${currentId} not found, trying ${formatId(x, y + 1, 1)}`);
            currentId = formatId(x, y + 1, 1);
            specialData = await fetchPool('special', currentId);
            if (specialData) {
                console.log(`Found pool ${currentId}, updating checkpoint.`);
                y = y + 1;
                z = 1;
            } else {
                console.log(`Pool ${currentId} not found either. No new numbered pool found.`);
                return;
            }
        }
    }

    const newCheckpoint = formatId(x, y, z);
    fs.writeFileSync(CHECKPOINT_FILE, newCheckpoint);

    const weponData = await fetchPool('weponbox', newCheckpoint);

    fs.writeFileSync(
        path.join(STATIC_DIR, `special_${newCheckpoint}.json`),
        JSON.stringify(specialData, null, 2),
    );
    if (weponData) {
        fs.writeFileSync(
            path.join(STATIC_DIR, `weponbox_${newCheckpoint}.json`),
            JSON.stringify(weponData, null, 2),
        );
    }
    console.log(`Done processing numbered pool ${newCheckpoint}.`);
}

async function fetchRerunPools() {
    const suffixes = collectRerunSuffixes();
    const poolIds = [];
    for (const suffix of suffixes) {
        poolIds.push(`rerun_chr_${suffix}`);
        poolIds.push(`rerun_wpn_${suffix}`);
    }
    poolIds.sort();

    console.log(`Checking ${poolIds.length} rerun pool IDs...`);

    for (const poolId of poolIds) {
        const dest = path.join(STATIC_DIR, `${poolId}.json`);
        if (fs.existsSync(dest)) {
            console.log(`[SKIPPED] ${poolId}.json already exists.`);
            continue;
        }

        const data = await fetchPoolById(poolId);
        if (data) {
            fs.writeFileSync(dest, JSON.stringify(data, null, 2));
            console.log(`[SAVED] ${poolId}.json`);
        } else {
            console.log(`[MISS] ${poolId}`);
        }
    }
}

async function main() {
    if (!fs.existsSync(STATIC_DIR)) {
        fs.mkdirSync(STATIC_DIR, { recursive: true });
    }

    await fetchNumberedCheckpoint();
    await fetchRerunPools();
}

main().catch(console.error);
