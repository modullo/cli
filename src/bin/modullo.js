#!/usr/bin/env node

/*
Modullo Installer
*/

const path = require("path");

// CLI Processor
require(path.join(__dirname, "../lib/cli.js")).cli(process.argv);
