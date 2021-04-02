const arg = require("arg");
const path = require("path");
const params = require(path.join(__dirname, "./params.js"));
const Listr = require("listr");
const CLI = require("clui");
const Spinner = CLI.Spinner;
const execa = require("execa");
const chalk = require("chalk");

async function modulloRequirements() {
  const status = new Spinner("Checking for Requirements...");
  status.start();

  var count_requirements = 7;
  var count_checks = 0;

  console.log("\n");

  const modulloRequirement = new Listr([
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
                        "Docker not available, https://www.docker.com/get-started to install"
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
      console.error(
        "%s Framework Requirements failed: " + err,
        chalk.red.bold("Error")
      );
      console.log("\n");
      process.exit(1);
    });
}

exports.installRequirements = modulloRequirements;
