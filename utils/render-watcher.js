require('esbuild-register');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const { promisify } = require('util');
const getMermaidFromJSON = require('../utils/parseMermaid').default;
const stripJsonComments = require('strip-json-comments');
// const elkLayouts = require('@mermaid-js/layout-elk');

const execAsync = promisify(exec);

// Mermaid configuration
// const mermaidConfig = {
//     theme: 'dark',
//     themeVariables: {
//         nodeBorder: '#FFFFFF',
//         edgeLabelBackground: '#0005',
//     },
// };

// Mermaid configuration
const mermaidConfig = {
    theme: 'dark',
    themeVariables: {
        nodeBorder: '#FFFFFF',
        edgeLabelBackground: '#0005',
    }
};

const rootDir = path.join(__dirname, '..');
const previewDir = path.join(rootDir, 'preview');
const flowchartDir = path.join(rootDir, 'flowcharts');

// Ensure preview directory exists
if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
}

// Update paths to use a 'temp' subfolder for temporary files
const tempDir = path.join(previewDir, 'temp');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Function to parse JSONC (JSON with comments) using the library
/**
 * Parses JSONC content (JSON with comments) into a JavaScript object.
 * @param {string} content - The JSONC content as a string.
 * @returns {object} - The parsed JavaScript object.
 */
function parseJSONC(content) {
    const jsonWithoutComments = stripJsonComments(content);
    return JSON.parse(jsonWithoutComments);
}

// Function to render a single chart
/**
 * Renders a chart from a given file path.
 * @param {string} filePath - The path to the JSON/JSONC file.
 */
async function renderChart(filePath) {
    try {
        const fileName = path.basename(filePath);
        const fileNameWithoutExt = path.parse(fileName).name;
        const outputPath = path.join(previewDir, `${fileNameWithoutExt}.png`);

        console.log(`Rendering ${fileName}...`);

        // Read and parse the JSON/JSONC file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        /** @type {TroubleshootingGuideProps} */
        const chartJSON = parseJSONC(fileContent);

        // Generate mermaid code
        const mermaidCode = getMermaidFromJSON(chartJSON);
        if (!mermaidCode) {
            console.error(`Failed to generate mermaid code for ${fileName}`);
            return;
        }

        // Create a temporary mermaid file in the temp folder
        const tempMmdPath = path.join(tempDir, `${fileNameWithoutExt}.mmd`);
        await fs.promises.writeFile(tempMmdPath, mermaidCode);

        // Create a unique config file in the temp folder
        const configPath = path.join(tempDir, `${fileNameWithoutExt}-config.json`);
        await fs.promises.writeFile(configPath, JSON.stringify({
            ...mermaidConfig,
            ...(chartJSON.renderOptions ?? {})
        }, null, 2));

        // Use mmdc CLI to render the chart
        try {
            const mmdcPath = path.join(__dirname, '..', 'node_modules', '.bin', 'mmdc.cmd');
            const command = `"${mmdcPath}" -i "${tempMmdPath}" -o "${outputPath}" -c "${configPath}" -b transparent -s 3.0`;

            console.log(`  Running: mmdc for ${fileNameWithoutExt}...`);
            const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
            if (stderr && !stderr.includes('info') && !stderr.includes('Info')) {
                console.log(`  Warning: ${stderr}`);
            }
            console.log(`✓ Generated ${fileNameWithoutExt}.png`);
        } catch (error) {
            if (error instanceof Error) {
                console.error(`✗ Error rendering ${fileName}:`, error.message);
            } else {
                console.error(`✗ Unknown error rendering ${fileName}`);
            }
        }

        // Clean up temporary files
        if (fs.existsSync(tempMmdPath)) {
            fs.unlinkSync(tempMmdPath);
        }

    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

// Update file watcher to observe files in the 'flowcharts' folder
function startWatcher() {
    console.log('Watching directory:', flowchartDir);
    const watcher = chokidar.watch(flowchartDir);

    watcher.on('add', async (filePath) => {
        debugger
        console.log(`\nNew file detected: ${filePath}`);
        await renderChart(filePath);
    });

    watcher.on('change', async (filePath) => {
        console.log(`\nFile changed: ${filePath}`);
        await renderChart(filePath);
    });

    watcher.on('error', error => console.error(`Watcher error: ${error}`));

    watcher.on('ready', () => {
        // console.log('Watcher ready. Watching these files:');
        // const watched = watcher.getWatched();
        // console.log(watched);
        console.log('File watcher ready. Press Ctrl+C to stop.\n');
    });
}

// Main execution
(async () => {
    console.log('=== Mermaid Chart Render Watcher ===\n');
    startWatcher();
})();
