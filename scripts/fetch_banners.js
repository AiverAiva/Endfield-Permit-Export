const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.join(__dirname, '..', 'static');
const BANNER_DIR = path.resolve(__dirname, '..', 'src/renderer/assets/banners');

/**
 * Downloads an image from a URL and saves it to the destination path.
 * @param {string} url 
 * @param {string} dest 
 */
async function downloadImage(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
}

async function main() {
    // Ensure the banner directory exists
    if (!fs.existsSync(BANNER_DIR)) {
        console.log(`Creating directory: ${BANNER_DIR}`);
        fs.mkdirSync(BANNER_DIR, { recursive: true });
    }

    // Read all JSON files from the static directory
    const jsonFiles = fs.readdirSync(STATIC_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${jsonFiles.length} pool data files in static directory.`);

    for (const file of jsonFiles) {
        const poolId = path.basename(file, '.json');
        const targetPath = path.join(BANNER_DIR, `${poolId}.png`);

        // Check if the banner image already exists
        if (fs.existsSync(targetPath)) {
            console.log(`[SKIPPED] ${poolId}.png already exists.`);
            continue;
        }

        console.log(`[MISSING] ${poolId}.png - Inspecting ${file}`);
        try {
            const raw = fs.readFileSync(path.join(STATIC_DIR, file), 'utf-8');
            const data = JSON.parse(raw);
            const imageUrl = data?.data?.pool?.up6_image || data?.data?.pool?.up6_banner;

            if (imageUrl) {
                console.log(`Downloading banner from ${imageUrl}...`);
                await downloadImage(imageUrl, targetPath);
                console.log(`[SUCCESS] Saved to ${targetPath}`);
            } else {
                console.warn(`[WARNING] No 'up6_image' or 'up6_banner' found in ${file}. Checking if it is a different structure...`);
                if (data?.code === 0 && data?.data?.pool) {
                     console.warn(`[WARNING] Banner image fields are missing from the pool data in ${file}.`);
                }
            }
        } catch (err) {
            console.error(`[ERROR] Failed to process ${file}:`, err.message);
        }
    }
    console.log('Finished banner synchronization.');
}

main().catch(console.error);
