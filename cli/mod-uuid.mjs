#!/usr/bin/env node
import { program } from "commander";

program
    // mod-uuid-generate command
    .command("generate", "Generates a new UUID v7.")
    .action(() => program.help());

program.parse(process.argv);
