import { generate as uuidv7 } from "../../core/uuid.js";
import { program } from "commander";

program.option("-n, --number <count>", "Number of UUIDs to generate", "1").action(async (count) => {
    const num = parseInt(count.number, 10);

    console.log(`Generating ${num} UUID v7(s):`);

    for (let i = 0; i < num; i++) {
        const uuid = uuidv7(undefined, true);
        console.log(uuid);
    }
});

program.parse(process.argv);
