import { generate as uuidv7 } from "../../core/uuid.js";
import { promises as fs } from "fs";
import { program } from "commander";
import path from "path";

program.argument("<filenames...>", "List of .mjson files to process").action(async (filenames) => {
    let allFilesValid = true;

    for (const file of filenames) {
        if (path.extname(file) !== ".mjson") {
            console.error(`❌ Error: File "${file}" must have a .mjson extension.\n`);
            allFilesValid = false;
        }
    }

    if (!allFilesValid) {
        console.error("Errors found. Exiting.\n");
        process.exit(1);
    }

    for (const file of filenames) {
        await idify(file);
    }
});

program.parse(process.argv);

/**
 * Processes a single .mjson file.
 * @param {string} filename - The path to the file.
 */
async function idify(filename) {
    console.log(`\nProcessing "${filename}"...\n`);
    let modified = false;
    let content;
    let data;

    try {
        content = await fs.readFile(filename, "utf-8");
    } catch (err) {
        console.error(`  -  ❌  Error reading file: ${err.message}`);
        return; // Skip this file
    }

    try {
        data = JSON.parse(content);
    } catch (err) {
        console.error(`  -  ❌  Error parsing JSON: ${err.message}`);
        return; // Skip this file
    }

    // Iterate over all top-level keys in the JSON object
    for (const key of Object.keys(data)) {
        const obj = data[key];

        // Check for an identifier under 'obj.values'
        if (obj && typeof obj.values === "object" && obj.values !== null) {
            // Check if 'identifier' is missing or falsy
            if (!obj.values.identifier) {
                const newId = uuidv7(undefined, true);
                obj.values.identifier = newId;
                console.log(`  -  ✅  Added identifier to "${key}": ${newId}\n`);
                modified = true;
            }
        }
    }

    // Update the file only if modifications were made
    if (modified) {
        try {
            const updatedContent = JSON.stringify(data, null, 4);
            await fs.writeFile(filename, updatedContent, "utf-8");
            console.log(`💾  Successfully updated "${filename}".\n`);
        } catch (err) {
            console.error(`❌  Error writing file: ${err.message}.\n`);
        }
    } else {
        console.log(`ℹ️  No modifications needed for "${filename}".\n`);
    }
}
