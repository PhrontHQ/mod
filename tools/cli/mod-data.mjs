#!/usr/bin/env node
import { program } from "commander";

program
    // mod-data-idify command
    .command("idify", "Ensures data object instances in .mjson files have an identifier.")
    .action(() => program.help());

program.parse(process.argv);
