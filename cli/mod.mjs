#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
    .name("mod", "CLI Tool for Mod Framework")
    .version("0.1.0")
    // mod-data command
    .command("data", "Commands related to data management")
    // mod-uuid command
    .command("uuid", "Commands related to UUID generation")
    .action(() => program.help());

program.parse(process.argv);
