#!/usr/bin/env node

import { program } from "commander";
import { init } from "../commands/init.js";
import { dev } from "../commands/dev.js";
import { builder } from "../commands/build.js";
import { previewer } from "../commands/preview.js";
import { deploy } from "../commands/deploy.js";
import { getVersion } from "../commands/utils.js";

program
  .name("wivex")
  .version("v" + getVersion(), "-v, --version", "Show version")
  .helpCommand();

program
  .command("init")
  .description("Initialize a project with a base template")
  .option("-r, --root <root>", "Root directory for the project")
  .action((options) => init(options));

program
  .command("dev")
  .description("Start the development server")
  .option("-r, --root <root>", "Root directory for the project")
  .option("-p, --port <port>", "Port for the development server")
  .action((options) => dev(options));

program
  .command("build")
  .description("Build the project for production")
  .option("-m, --mode <mode>", "Build mode (SPA, Static)")
  .option("-b, --base <base>", "Base URL for the project")
  .option("-r, --root <root>", "Root directory for the project")
  .option("-p, --prebuild <prebuild>", "preBuild root directory for the project")
  .option("-o, --outDir <outDir>", "Output directory for the build")
  .action((options) => builder(options));

program
  .command("preview")
  .description("Preview the project in the browser")
  .option("-r, --root <root>", "Root directory for the project")
  .action((options) => previewer(options));

program
  .command("deploy")
  .description("deploy to gh-pages")
  .option("-o, --outDir <outDir>", "Output directory for the build")
  .action((options) => deploy(options));

program.parse(process.argv);
