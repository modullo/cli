const arg = require("arg");
const path = require("path");
const params = require(path.join(__dirname, "./params.js"));
const Listr = require("listr");
const CLI = require("clui");
const Spinner = CLI.Spinner;
const execa = require("execa");
const chalk = require("chalk");
const installer = require(path.join(__dirname, "./installer.js"));
const Str = require("@supercharge/strings");

async function modulloRequirements(options) {
  const status = new Spinner("Checking for Requirements...");
  status.start();

  var count_requirements = 7;
  var count_checks = 0;

  console.log("\n");

  let modulloRequirement;

  if (options.modulloOS == "darwin") {
    modulloRequirement = new Listr([
      {
        title: "Node & NPM",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking Node",
                task: (ctx, task) =>
                  execa("node", ["-v"])
                    .then(result => {
                      //command: 'node -v',exitCode: 0,stdout: 'v12.16.1',
                      //stderr: '', all: undefined, failed: false, timedOut: false, isCanceled: false, killed: false
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Node not available, visit https://nodejs.org/ to install"
                        );
                        throw new Error(
                          "NPM not available, visit https://nodejs.org/ to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.node = false;
                      task.skip(
                        "Node not available, visit https://nodejs.org/ to install"
                      );
                      throw new Error(
                        "NPM not available, visit https://nodejs.org/ to install"
                      );
                    })
              },
              {
                title: "Checking for NPM",
                task: (ctx, task) =>
                  execa("npm", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Node not available, visit https://nodejs.org/ to install"
                        );
                        throw new Error(
                          "NPM not available, visit https://nodejs.org/ to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.npm = false;
                      task.skip(
                        "NPM not available, visit https://nodejs.org/ to install"
                      );
                      throw new Error(
                        "NPM not available, visit https://nodejs.org/ to install"
                      );
                    })
              }
            ],
            { concurrent: false }
          );
        }
      },
      {
        title: "Package Manager",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking for Homebrew",
                task: (ctx, task) =>
                  execa("brew", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes("Homebrew/homebrew-core") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Homebrew not available, https://brew.sh/ to install"
                        );
                        throw new Error(
                          "Homebrew not available, https://brew.sh/ to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.docker = false;
                      task.skip(
                        "Homebrew not available, https://brew.sh/ to install"
                      );
                      throw new Error(
                        "Homebrew not available, https://brew.sh/ to install"
                      );
                    })
              }
            ],
            { concurrent: false }
          );
        }
      },
      {
        title: "Docker",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking for Docker",
                task: (ctx, task) =>
                  execa("docker", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Docker not available, https://www.docker.com/get-started to install"
                        );
                        throw new Error(
                          `Docker not available, https://www.docker.com/get-started to install`
                        );
                      }
                    })
                    .catch(() => {
                      ctx.docker = false;
                      task.skip(
                        "Docker not available, https://www.docker.com/get-started to install"
                      );
                      throw new Error(
                        "Docker not available, https://www.docker.com/get-started to install"
                      );
                    })
              },
              {
                title: "Checking for Docker Compose",
                task: (ctx, task) =>
                  execa("docker-compose", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Docker not available, https://www.docker.com/get-started to install"
                        );
                        throw new Error(
                          "Docker not available, https://www.docker.com/get-started to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.docker_compose = false;
                      task.skip(
                        "Docker not available, https://www.docker.com/get-started to install"
                      );
                      throw new Error(
                        "Docker not available, https://www.docker.com/get-started to install"
                      );
                    })
              }
            ],
            { concurrent: false }
          );
        }
      },
      {
        title: "Utilities",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking for UnZip",
                task: (ctx, task) =>
                  execa("unzip", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes("by Info-ZIP") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip("UnZip not available");
                        throw new Error("UnZip not available");
                      }
                    })
                    .catch(() => {
                      ctx.unzip = false;
                      task.skip("UnZip not available");
                      throw new Error("UnZip not available");
                    })
              },
              {
                title: "Checking for cURL",
                task: (ctx, task) =>
                  execa("curl", ["--version"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip("cURL not available");
                        throw new Error("cURL not available");
                      }
                    })
                    .catch(() => {
                      ctx.curl = false;
                      task.skip("cURL not available");
                      throw new Error("cURL not available");
                    })
              },
              {
                title: "Checking for cp (copy utility)",
                task: (ctx, task) =>
                  execa("cp", ["-v"]).catch(status => {
                    //console.log(status)
                    if (status.exitCode == "64") {
                      count_checks++;
                    } else {
                      ctx.curl = false;
                      task.skip("cp (copy utility) not available");
                      throw new Error("cp (copy utility) not available");
                    }
                  })
              }
            ],
            { concurrent: false }
          );
        }
      }
    ]);
  }

  if (options.modulloOS == "win32") {
    modulloRequirement = new Listr([
      {
        title: "Node & NPM",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking Node",
                task: (ctx, task) =>
                  execa("node", ["-v"])
                    .then(result => {
                      //command: 'node -v',exitCode: 0,stdout: 'v12.16.1',
                      //stderr: '', all: undefined, failed: false, timedOut: false, isCanceled: false, killed: false
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Node not available, visit https://nodejs.org/ to install"
                        );
                        throw new Error(
                          "NPM not available, visit https://nodejs.org/ to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.node = false;
                      task.skip(
                        "Node not available, visit https://nodejs.org/ to install"
                      );
                      throw new Error(
                        "NPM not available, visit https://nodejs.org/ to install"
                      );
                    })
              },
              {
                title: "Checking for NPM",
                task: (ctx, task) =>
                  execa("npm", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Node not available, visit https://nodejs.org/ to install"
                        );
                        throw new Error(
                          "NPM not available, visit https://nodejs.org/ to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.npm = false;
                      task.skip(
                        "NPM not available, visit https://nodejs.org/ to install"
                      );
                      throw new Error(
                        "NPM not available, visit https://nodejs.org/ to install"
                      );
                    })
              }
            ],
            { concurrent: false }
          );
        }
      },
      {
        title: "Package Manager",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking for Chocolatey",
                task: (ctx, task) =>
                  execa("choco", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Chocolatey not available, https://chocolatey.org/install to install"
                        );
                        throw new Error(
                          "Chocolatey not available, https://chocolatey.org/install to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.docker = false;
                      task.skip(
                        "Chocolatey not available, https://chocolatey.org/install to install"
                      );
                      throw new Error(
                        "Chocolatey not available, https://chocolatey.org/install to install"
                      );
                    })
              }
            ],
            { concurrent: false }
          );
        }
      },
      {
        title: "Docker",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking for Docker",
                task: (ctx, task) =>
                  execa("docker", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Docker not available, https://www.docker.com/get-started to install1 || docker-desktop,Docker Desktop for Windows"
                        );
                        throw new Error(
                          `Docker not available, https://www.docker.com/get-started to install2 || docker-desktop,Docker Desktop for Windows`
                        );
                      }
                    })
                    .catch(() => {
                      ctx.docker = false;
                      task.skip(
                        "Docker not available, https://www.docker.com/get-started to install3 || docker-desktop,Docker Desktop for Windows"
                      );
                      throw new Error(
                        "Docker not available, https://www.docker.com/get-started to install4 || docker-desktop,Docker Desktop for Windows"
                      );
                    })
              },
              {
                title: "Checking for Docker Compose",
                task: (ctx, task) =>
                  execa("docker-compose", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip(
                          "Docker not available, https://www.docker.com/get-started to install"
                        );
                        throw new Error(
                          "Docker not available, https://www.docker.com/get-started to install"
                        );
                      }
                    })
                    .catch(() => {
                      ctx.docker_compose = false;
                      task.skip(
                        "Docker not available, https://www.docker.com/get-started to install"
                      );
                      throw new Error(
                        "Docker not available, https://www.docker.com/get-started to install"
                      );
                    })
              }
            ],
            { concurrent: false }
          );
        }
      },
      {
        title: "Utilities",
        task: () => {
          return new Listr(
            [
              {
                title: "Checking for UnZip",
                task: (ctx, task) =>
                  execa("unzip", ["-v"])
                    .then(result => {
                      if (
                        result.stdout.includes("by Info-ZIP") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip("UnZip not available");
                        throw new Error("UnZip not available");
                      }
                    })
                    .catch(() => {
                      ctx.unzip = false;
                      task.skip("UnZip not available");
                      throw new Error("UnZip not available");
                    })
              },
              {
                title: "Checking for cURL",
                task: (ctx, task) =>
                  execa("curl", ["--version"])
                    .then(result => {
                      if (
                        result.stdout.includes(".") &&
                        !result.stdout.includes("command not found")
                      ) {
                        count_checks++;
                      } else {
                        task.skip("cURL not available");
                        throw new Error("cURL not available");
                      }
                    })
                    .catch(() => {
                      ctx.curl = false;
                      task.skip("cURL not available");
                      throw new Error("cURL not available");
                    })
              },
              {
                title: "Checking for cp (copy utility)",
                task: (ctx, task) =>
                  execa("cp", ["-v"]).catch(status => {
                    //console.log(status)
                    if (status.exitCode == "64") {
                      count_checks++;
                    } else {
                      ctx.curl = false;
                      task.skip("cp (copy utility) not available");
                      throw new Error("cp (copy utility) not available");
                    }
                  })
              }
            ],
            { concurrent: false }
          );
        }
      }
    ]);
  }

  await modulloRequirement
    .run()
    .then(result => {
      if (count_checks >= count_requirements) {
        console.log("\n");
        console.log(
          `%s All ${count_checks} of ${count_requirements} Framework Requirement(s) passed`,
          chalk.green.bold("Success")
        );
        console.log("\n");

        status.stop();
      } else {
        console.log("\n");
        console.log(
          `%s ${count_checks} of ${count_requirements} Framework Requirement(s) passed. All must be met to proceed`,
          chalk.yellow.bold("Warning")
        );
        console.log("\n");

        process.exit(1);
      }
    })
    .catch(err => {
      console.log("\n");

      let error_message = err;

      let install_software = false;

      let install_data = [];

      if (options.debugMode) {
        console.log("%s Error String: " + err, chalk.yellow.bold("DEBUG: "));
      }

      //inspect error if it contains a prompt to install required software
      if (Str(err).contains("||")) {
        let errs = Str(err).split("||");
        if (options.debugMode) {
          console.log(
            "%s Install String: " + errs[1],
            chalk.yellow.bold("DEBUG: ")
          );
        }

        error_message = errs[0];
        install_software = true;
        install_data = Str(errs[1])
          .trim()
          .split(",");
      }

      console.error(
        "%s Framework Requirements failed: " + error_message,
        chalk.red.bold("Error")
      );
      console.log("\n");
      if (install_software) {
        installer.install(options, install_data[0], install_data[1]);
      } else {
        process.exit(1);
      }
    });
}

exports.installRequirements = modulloRequirements;
