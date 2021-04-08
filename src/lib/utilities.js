const fs = require("fs");
const Listr = require("listr");
const ncp = require("ncp");
const path = require("path");
const envfile = require("envfile");
const util = require("util");
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const spawn = require("child_process").spawn;
const CLI = require("clui");
const Spinner = CLI.Spinner;
const access = util.promisify(fs.access);
const copy = util.promisify(ncp);
const axios = require("axios");
const mysql = require("mysql");
const Str = require("@supercharge/strings");
const params = require(path.join(__dirname, "./params.js"));
const yaml = require("js-yaml");

async function installTemplateFiles(options) {
  if (options.debugMode) {
    console.log(
      "%s Target Directory: " + options.targetDirectory,
      chalk.yellow.bold("DEBUG: ")
    );
    console.log(
      "%s Template Directory: " + options.templateDirectory,
      chalk.yellow.bold("DEBUG: ")
    );
  }
  await copy(options.templateDirectory, `${options.targetDirectory}`, {
    clobber: false
  });
}

exports.installTemplateFiles = installTemplateFiles;

async function setupInstallationENV(options) {
  //const status = new Spinner("Setting up Installation ENV...");
  //status.start();

  let sourcePath =
    options.targetDirectory + `/.env.` + options.template.toLowerCase();

  let data = {
    HOST_DOMAIN: options.answers.domain,
    SERVICE_PROXY_NAME:
      params.docker.services.proxy.name + options.container_name_addon,
    SERVICE_PROXY_PORT:
      params.docker.services.proxy.port + options.port_increment,
    SERVICE_PROXY_IMAGE: params.docker.services.proxy.image,
    SERVICE_RELOADER_NAME:
      params.docker.services.reloader.name + options.container_name_addon,
    SERVICE_RELOADER_PORT:
      params.docker.services.reloader.port + options.port_increment,
    SERVICE_RELOADER_IMAGE: params.docker.services.reloader.image,
    SERVICE_CORE_PHP_NAME:
      params.docker.services.core_php.name + options.container_name_addon,
    SERVICE_CORE_PHP_PORT:
      params.docker.services.core_php.port + options.port_increment,
    SERVICE_CORE_PHP_IMAGE: params.docker.services.core_php.image,
    SERVICE_CORE_PHP_WORKING_DIR: params.docker.services.core_php.working_dir,
    SERVICE_CORE_PHP_ENV_FILE:
      params.docker.services.core_php.env_file + options.template.toLowerCase(),
    SERVICE_CORE_PHP_VOLUMES_ENV:
      params.docker.services.core_php.env_file +
      options.template.toLowerCase() +
      ":" +
      params.docker.services.core_php.volumes_env,
    SERVICE_CORE_PHP_VOLUMES_PHP_INI:
      params.docker.services.core_php.volumes_php_ini,
    SERVICE_CORE_PHP_SRC_DIR: params.docker.services.core_php.src_dir,
    SERVICE_CORE_PHP_APP_DIR: params.docker.services.core_php.app_dir,
    SERVICE_CORE_WEB_SUBDOMAIN: params.docker.services.core_web.subdomain,
    SERVICE_CORE_WEB_NAME:
      params.docker.services.core_web.name + options.container_name_addon,
    SERVICE_CORE_WEB_PORT:
      params.docker.services.core_web.port + options.port_increment,
    SERVICE_HUB_PHP_NAME:
      params.docker.services.hub_php.name + options.container_name_addon,
    SERVICE_HUB_PHP_PORT:
      params.docker.services.hub_php.port + options.port_increment,
    SERVICE_HUB_PHP_IMAGE: params.docker.services.hub_php.image,
    SERVICE_HUB_PHP_WORKING_DIR: params.docker.services.hub_php.working_dir,
    SERVICE_HUB_PHP_ENV_FILE:
      params.docker.services.hub_php.env_file + options.template.toLowerCase(),
    SERVICE_HUB_PHP_VOLUMES_ENV:
      params.docker.services.hub_php.env_file +
      options.template.toLowerCase() +
      ":" +
      params.docker.services.hub_php.volumes_env,
    SERVICE_HUB_PHP_VOLUMES_PHP_INI:
      params.docker.services.hub_php.volumes_php_ini,
    SERVICE_HUB_PHP_SRC_DIR: params.docker.services.hub_php.src_dir,
    SERVICE_HUB_PHP_APP_DIR: params.docker.services.hub_php.app_dir,
    SERVICE_HUB_WEB_SUBDOMAIN: params.docker.services.hub_web.subdomain,
    SERVICE_HUB_WEB_NAME:
      params.docker.services.hub_web.name + options.container_name_addon,
    SERVICE_HUB_WEB_PORT:
      params.docker.services.hub_web.port + options.port_increment,
    SERVICE_MYSQL_SUBDOMAIN: params.docker.services.mysql.subdomain,
    SERVICE_MYSQL_NAME:
      params.docker.services.mysql.name + options.container_name_addon,
    SERVICE_MYSQL_PORT:
      params.docker.services.mysql.port + options.port_increment,
    SERVICE_MYSQL_USER: params.docker.services.mysql.user,
    SERVICE_MYSQL_PASSWORD: options.databasePassword,
    SERVICE_MYSQL_DB_CORE: params.docker.services.mysql.db_core,
    SERVICE_MYSQL_DB_HUB: params.docker.services.mysql.db_hub,
    SERVICE_REDIS_SUBDOMAIN: params.docker.services.redis.subdomain,
    SERVICE_REDIS_NAME:
      params.docker.services.redis.name + options.container_name_addon,
    SERVICE_REDIS_PORT:
      params.docker.services.redis.port + options.port_increment,
    SERVICE_REDIS_IMAGE: params.docker.services.redis.image,
    SERVICE_SMTP_SUBDOMAIN: params.docker.services.smtp.subdomain,
    SERVICE_SMTP_NAME:
      params.docker.services.smtp.name + options.container_name_addon,
    SERVICE_SMTP_PORT:
      params.docker.services.smtp.port + options.port_increment,
    SERVICE_SMTP_PORT_2:
      params.docker.services.smtp.port_2 + options.port_increment,
    SERVICE_SMTP_IMAGE: params.docker.services.smtp.image
  };

  await fs.writeFile(sourcePath, envfile.stringify(data), err => {
    if (err) {
      console.log(chalk.red.bold(`${err}`));
      //status.stop;
      process.exit(1);
      //throw err;
    } else {
      //status.stop;
      console.log("%s Installation ENV Installed", chalk.green.bold("Success"));
    }
  });
}

exports.setupInstallationENV = setupInstallationENV;

async function downloadFiles(options, app) {
  let status = new Spinner(
    "Downloading " + app.toUpperCase() + " application files (from source)..."
  );
  status.start();

  let template = options.template.toLowerCase();

  let destinationDir =
    `${options.targetDirectory}` + `/src/tmp/` + `${app}` + `/`;
  let destinationFile = `${app}` + `.tar.gz`;
  let destinationPath = `${destinationDir}` + `${destinationFile}`;
  let destinationExtractPath = destinationDir;

  let repoDownloadLink = "";

  let repoArray = params.versions[template];

  repoDownloadLink = `https://github.com/${repoArray[`git_repo_${app}`] +
    "/tarball/" +
    repoArray[`git_branch_${app}`]}`;

  if (repoDownloadLink.length == 0) {
    console.log("%s Invalid repository URL", chalk.red.bold("Error"));
    process.exit(1);
  }

  try {
    if (options.debugMode) {
      //console.log("DEBUG: File Copy Details: ");
      console.log(
        `Downloading from ` +
          `${repoDownloadLink}` +
          ` to ` +
          `${destinationPath}`
      );
    }

    let ls = await spawn("curl", [
      `-LJ`,
      repoDownloadLink,
      `-o`,
      `${destinationPath}`
    ]);

    ls.on("close", async code => {
      if (code === 0) {
        console.log("%s Download Complete", chalk.green.bold("Success"));
        status.stop();
        let result = await extractFiles(
          options,
          template,
          app,
          destinationDir,
          destinationFile,
          destinationExtractPath
        );
      }
    });
  } catch (err) {
    console.log("%s Download Error!", chalk.red.bold("Error"));
    return "download_failed";
  } finally {
  }
}

exports.downloadFiles = downloadFiles;

async function extractFiles(
  options,
  template,
  app,
  extractDir,
  extractFile,
  extractDestinationPath
) {
  let status = new Spinner("Extracting " + app.toUpperCase() + " Files...");
  status.start();

  if (options.debugMode) {
    //console.log("DEBUG: File Copy Details: ");
    console.log(
      `Extracting ` +
        `${extractDir}` +
        `${extractFile}` +
        ` to ` +
        `${extractDestinationPath}`
    );
  }

  let { spawn, exec } = require("child_process");
  try {
    let ls2 = await spawn("tar", [
      `-zxf`,
      `${extractDir}` + `${extractFile}`,
      `-C`,
      extractDestinationPath
    ]);

    ls2.on("close", async code => {
      if (code === 0) {
        console.log("%s Extract Complete", chalk.green.bold("Success"));
        status.stop();
        //In development, destination copypath is src folder; In Production, destination copypath is a nginx public folder ;
        let copyPath =
          options.template.toLowerCase() == "development" ||
          options.template.toLowerCase() == "deploy"
            ? `${options.targetDirectory}` + `/src/` + `${app}` + `/`
            : `${options.targetDirectory}` + `/nginx/` + `${app}` + `/public/`;
        let result = await copyFiles(
          options,
          app,
          extractDestinationPath,
          copyPath
        );
      }
    });
  } catch (err) {
    console.log("%s Extract Error!" + err, chalk.red.bold("Error"));
    return "extract_failed";
  } finally {
  }
}

exports.extractFiles = extractFiles;

async function copyFiles(options, app, sourceFolder, destinationFolder) {
  let status = new Spinner("Copying " + app.toUpperCase() + " Files...");
  status.start();
  let { spawn, exec } = require("child_process");
  let sourceFile = "";

  try {
    let fs = require("fs"),
      path = require("path");

    let sourceDir = sourceFolder;
    const files = fs.readdirSync(sourceDir);
    for (const file_or_folder of files) {
      let stat = fs.lstatSync(path.join(sourceDir, file_or_folder));
      if (stat.isDirectory()) {
        //since only one zip file and one extracted folder
        sourceFile = file_or_folder; //we choose the folder
        break;
      }
    }

    //In development, copy all source files folder; In production, copy ONLY public source files;
    sourceFile =
      options.template.toLowerCase() == "development" ||
      options.template.toLowerCase() == "deploy"
        ? sourceFile
        : sourceFile + "/public";

    if (options.debugMode) {
      //console.log("DEBUG: File Copy Details: ");
      console.log(
        `Copying ` +
          `${sourceFolder}` +
          `${sourceFile}` +
          ` to ` +
          `${destinationFolder}`
      );
    }

    let ls3 = await spawn("cp", [
      `-a`,
      `${sourceFolder}` + `${sourceFile}/.`,
      `${destinationFolder}`
    ]);

    ls3.on("close", async code => {
      if (code === 0) {
        console.log("%s Copy Complete", chalk.green.bold("Success"));
        status.stop();
        let cleanupFolder = `${sourceFolder}`;
        let result = await cleanupFiles(
          options,
          app,
          cleanupFolder,
          destinationFolder
        );
      }
    });
  } catch (err) {
    //console.log(err)
    console.log("%s Copy Error!" + err, chalk.red.bold("Error"));
    return "copy_failed";
  } finally {
  }
}

exports.copyFiles = copyFiles;

async function cleanupFiles(options, app, cleanupFolder, destinationFolder) {
  let status = new Spinner(
    "Cleaning up " + app.toUpperCase() + " downloads..."
  );
  status.start();
  let { spawn, exec } = require("child_process");

  if (options.debugMode) {
    console.log(
      `%s Cleaning ` + `${cleanupFolder}...`,
      chalk.yellow.bold("DEBUG: ")
    );
  }

  try {
    let ls = await spawn("rm", [`-rf`, `${cleanupFolder}`]);

    ls.on("close", async code => {
      if (code === 0) {
        console.log("%s Cleanup Complete", chalk.green.bold("Success"));
        status.stop();
        // process next activities
        if (app == "core" && options.template.toLowerCase() != "deploy") {
          await downloadFiles(options, "hub");
        } else if (app == "hub" && options.template.toLowerCase() != "deploy") {
          await installContainerServices(options);
        } else if (options.template.toLowerCase() == "deploy") {
          heroku.deployDorcasApp(options, app, destinationFolder);
        }
      }
    });
  } catch (err) {
    console.log("%s Cleanup Error!", chalk.red.bold("Error"));
    return "cleanup_failed";
  } finally {
  }
}

exports.cleanupFiles = cleanupFiles;

async function setupCoreENV(options) {
  let host_scheme,
    host_domain_core,
    host_domain_hub,
    host_domain,
    host_port_core,
    host_port_hub;

  let sourcePath =
    options.template.toLowerCase() == "deploy"
      ? options.targetDirectory +
        `/.env.deploy.` +
        options.template.toLowerCase()
      : options.targetDirectory +
        `/app/env_core_` +
        options.template.toLowerCase();

  if (
    options.template.toLowerCase() == "production" ||
    options.template.toLowerCase() == "development"
  ) {
    //determine proper url format for both localhost and dns
    host_scheme =
      options.answers.dns === "dns" ? "https" : params.general.http_scheme;

    host_domain_core =
      options.answers.dns === "dns"
        ? params.docker.services.core_web.subdomain +
          "." +
          options.answers.domain
        : params.general.host;

    host_domain_hub =
      options.answers.dns === "dns"
        ? options.answers.domain
        : params.general.host;

    host_domain =
      options.answers.dns === "dns"
        ? options.answers.domain
        : params.general.host;

    host_port_core =
      options.answers.dns === "dns"
        ? ""
        : ":" + (params.docker.services.core_web.port + options.port_increment);

    host_port_hub =
      options.answers.dns === "dns"
        ? ""
        : ":" + (params.docker.services.hub_web.port + options.port_increment);
  } else {
    //determine proper url format for deploy locations
    host_scheme = "https";
    host_domain_core = options.deployHostCore;
    host_domain_hub = options.deployHostHub;
    host_domain = options.deployDomain;
    host_port_core = "";
    host_port_hub = "";
  }

  let db_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBHost
      : params.docker.services.mysql.name + options.container_name_addon;
  let db_database_core =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBCore
      : params.docker.services.mysql.db_core;
  let db_database_hub =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBHub
      : params.docker.services.mysql.db_hub;
  let db_username =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBUser
      : params.docker.services.mysql.user;
  let db_password =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBPass
      : options.databasePassword;
  let db_port =
    options.template.toLowerCase() == "deploy" ? options.deployDBPort : "3306";
  let redis_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployRedisHost
      : params.docker.services.redis.name + options.container_name_addon;
  let redis_pass =
    options.template.toLowerCase() == "deploy"
      ? options.deployRedisPass
      : "null";
  let redis_port =
    options.template.toLowerCase() == "deploy"
      ? options.deployRedisPort
      : "6379";
  let mail_driver =
    options.template.toLowerCase() == "deploy"
      ? options.deployMailDriver
      : "smtp";
  let mail_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployMailHost
      : params.docker.services.smtp.name + options.container_name_addon;
  let mail_port =
    options.template.toLowerCase() == "deploy"
      ? options.deployMailPort
      : "1025";

  let data = {
    APP_NAME: "DorcasCore",
    APP_ENV:
      options.template.toLowerCase() == "development"
        ? "development"
        : "production",
    APP_KEY: Str.random(32),
    APP_DEBUG:
      options.template.toLowerCase() == "development" ? "true" : "false",
    APP_LOG_LEVEL: "debug",
    DORCAS_EDITION: "business",
    DORCAS_HOST_API: `${host_scheme}://${host_domain_core}${host_port_core}`,
    DORCAS_HOST_HUB: `${host_scheme}://${host_domain_hub}${host_port_hub}`,
    DORCAS_BASE_DOMAIN: host_domain,
    APP_URL: `${host_scheme}://${host_domain_core}${host_port_core}`,
    APP_SITE_URL: `${host_scheme}://${host_domain_hub}${host_port_hub}`,
    APP_URL_STATIC: `${host_scheme}://${host_domain_core}${host_port_core}`,
    DEPLOY_ENV:
      options.template.toLowerCase() == "deploy" ? "deploy" : "docker",
    DB_CONNECTION: "mysql",
    DB_HOST: db_host,
    DB_PORT: db_port,
    DB_DATABASE: db_database_core,
    DB_USERNAME: db_username,
    DB_PASSWORD: db_password,
    DB_HUB_HOST: db_host,
    DB_HUB_PORT: db_port,
    DB_HUB_DATABASE: db_database_hub,
    DB_HUB_USERNAME: db_username,
    DB_HUB_PASSWORD: db_password,
    CACHE_DRIVER: "redis",
    QUEUE_DRIVER: "redis",
    FILESYSTEM_DRIVER: "file",
    REDIS_HOST: redis_host,
    REDIS_PASSWORD: redis_pass,
    REDIS_PORT: redis_port,
    REDIS_CLIENT: "predis",
    MAIL_DRIVER: mail_driver,
    MAIL_HOST: mail_host,
    MAIL_PORT: mail_port
  };

  if (options.template.toLowerCase() == "deploy") {
    data["DB_HUB_PREFIX"] = "hub_";
  }

  if (options.debugMode) {
    console.log(
      "%s Writing CORE ENV to : " + sourcePath,
      chalk.yellow.bold("DEBUG: ")
    );
  }

  if (options.template.toLowerCase() == "deploy") {
    if (options.deployPlatform == "heroku") {
      let herokuConfigs = "";
      for (var key in data) {
        if (!data.hasOwnProperty(key)) {
          continue;
        } // skip this property
        herokuConfigs += `${key}=${data[key]} `;
      }
      herokuConfigs = Str(herokuConfigs)
        .rtrim()
        .get();

      options = {
        ...options,
        deployENVCore: sourcePath,
        herokuConfigsCore: herokuConfigs
      };

      return {
        env: data,
        options: options
      };
    }
  }

  await fs.writeFile(sourcePath, envfile.stringify(data), err => {
    if (err) {
      console.log(chalk.red.bold(`${err}`));
      console.log("error");
      //status.stop;
      process.exit(1);
      //throw err;
    } else {
      //status.stop;
      console.log(
        "%s Core ENV successfully Installed",
        chalk.green.bold("Success")
      );
    }
  });
}

exports.setupCoreENV = setupCoreENV;

async function setupHubENV(options) {
  let host_scheme,
    host_domain_core,
    host_domain_hub,
    host_domain,
    host_port_core,
    host_port_hub;

  let sourcePath =
    options.template.toLowerCase() == "deploy"
      ? options.targetDirectory +
        `/.env.deploy.` +
        options.template.toLowerCase()
      : options.targetDirectory +
        `/app/env_hub_` +
        options.template.toLowerCase();

  if (
    options.template.toLowerCase() == "production" ||
    options.template.toLowerCase() == "development"
  ) {
    //determine proper url format for both localhost and dns
    host_scheme =
      options.answers.dns === "dns" ? "https" : params.general.http_scheme;
    host_domain_core =
      options.answers.dns === "dns"
        ? params.docker.services.core_web.subdomain +
          "." +
          options.answers.domain
        : params.general.host;
    host_domain_hub =
      options.answers.dns === "dns"
        ? options.answers.domain
        : params.general.host;
    host_domain =
      options.answers.dns === "dns"
        ? options.answers.domain
        : params.general.host;
    host_port_core =
      options.answers.dns === "dns"
        ? ""
        : ":" + (params.docker.services.core_web.port + options.port_increment);
    host_port_hub =
      options.answers.dns === "dns"
        ? ""
        : ":" + (params.docker.services.hub_web.port + options.port_increment);
  } else {
    //determine proper url format for deploy locations
    host_scheme = "https";
    host_domain_core = options.deployHostCore;
    host_domain_hub = options.deployHostHub;
    host_domain = options.deployDomain;
    host_port_core = "";
    host_port_hub = "";
  }

  let db_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBHost
      : params.docker.services.mysql.name + options.container_name_addon;
  let db_database_core =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBCore
      : params.docker.services.mysql.db_core;
  let db_database_hub =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBHub
      : params.docker.services.mysql.db_hub;
  let db_username =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBUser
      : params.docker.services.mysql.user;
  let db_password =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBPass
      : options.databasePassword;
  let db_port =
    options.template.toLowerCase() == "deploy" ? options.deployDBPort : "3306";
  let redis_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployRedisHost
      : params.docker.services.redis.name + options.container_name_addon;
  let redis_pass =
    options.template.toLowerCase() == "deploy"
      ? options.deployRedisPass
      : "null";
  let redis_port =
    options.template.toLowerCase() == "deploy"
      ? options.deployRedisPort
      : "6379";
  let mail_driver =
    options.template.toLowerCase() == "deploy"
      ? options.deployMailDriver
      : "smtp";
  let mail_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployMailHost
      : params.docker.services.smtp.name + options.container_name_addon;
  let mail_port =
    options.template.toLowerCase() == "deploy"
      ? options.deployMailPort
      : "1025";

  // SDK_HOST_PRODUCTION: "https://" + params.docker.services.core_web.name + options.container_name_addon + ":80",
  //DORCAS_BASE_URL: `http://${params.docker.services.core_web.name + options.container_name_addon}:80`,
  //STANDARD_HOST: options.answers.dns === "dns" ? options.answers.domain : `localhost:${params.docker.services.hub_web.port}`,
  let data = {
    APP_NAME: "DorcasHub",
    APP_ENV:
      options.template.toLowerCase() == "development"
        ? "development"
        : "production",
    APP_KEY: Str.random(32),
    APP_DEBUG:
      options.template.toLowerCase() == "development" ? "true" : "false",
    APP_LOG_LEVEL: "debug",
    DORCAS_EDITION: "business",
    SDK_HOST_PRODUCTION: `https://${host_domain_core}${host_port_core}`,
    DORCAS_BASE_URL: `https://${host_domain_core}${host_port_core}`,
    APP_URL: `${host_scheme}://${host_domain_hub}${host_port_hub}`,
    APP_URL_STATIC: `${host_scheme}://${host_domain_hub}${host_port_hub}`,
    DEPLOY_ENV: "docker",
    STANDARD_HOST: host_domain,
    DORCAS_BASE_DOMAIN: host_domain,
    DORCAS_ENV:
      options.template.toLowerCase() == "development"
        ? "development"
        : "production",
    DEPLOY_ENV:
      options.template.toLowerCase() == "deploy" ? "deploy" : "docker",
    DB_CONNECTION: "mysql",
    DB_HOST: db_host,
    DB_PORT: db_port,
    DB_DATABASE: db_database_hub,
    DB_USERNAME: db_username,
    DB_PASSWORD: db_password,
    BROADCAST_DRIVER: "pusher",
    CACHE_DRIVER: "redis",
    QUEUE_DRIVER: "redis",
    FILESYSTEM_DRIVER: "file",
    SESSION_DRIVER: "redis",
    SESSION_LIFETIME: "120",
    SESSION_CONNECTION: "default",
    REDIS_HOST: redis_host,
    REDIS_PASSWORD: redis_pass,
    REDIS_PORT: redis_port,
    REDIS_CLIENT: "predis",
    MAIL_DRIVER: mail_driver,
    MAIL_HOST: mail_host,
    MAIL_PORT: mail_port,
    DORCAS_CLIENT_ID: options.clientId,
    DORCAS_CLIENT_SECRET: options.clientSecret,
    DORCAS_PERSONAL_CLIENT_ID: options.clientId,
    DORCAS_PERSONAL_CLIENT_SECRET: options.clientSecret
  };

  if (options.template.toLowerCase() == "deploy") {
    data["DB_HUB_PREFIX"] = "hub_";
  }

  if (options.debugMode) {
    console.log(
      "%s Writing HUB ENV to : " + sourcePath,
      chalk.yellow.bold("DEBUG: ")
    );
  }

  if (options.template.toLowerCase() == "deploy") {
    if (options.deployPlatform == "heroku") {
      let herokuConfigs = "";
      for (var key in data) {
        if (!data.hasOwnProperty(key)) {
          continue;
        } // skip this property
        herokuConfigs += `${key}=${data[key]} `;
      }
      herokuConfigs = Str(herokuConfigs)
        .rtrim()
        .get();

      options = {
        ...options,
        deployENVHub: sourcePath,
        herokuConfigsHub: herokuConfigs
      };

      return {
        env: data,
        options: options
      };
    }
  }

  fs.writeFile(sourcePath, envfile.stringify(data), err => {
    if (err) {
      console.log(chalk.red.bold(`${err}`));
      process.exit(1);
    } else {
      console.log(
        "%s Hub ENV successfully Installed",
        chalk.green.bold("Success")
      );
    }
  });
}

exports.setupHubENV = setupHubENV;

async function writeYAML(options, data, output_path, callback) {
  let yamlStr = yaml.dump(data);
  await fs.writeFile(output_path, yamlStr, "utf8", err => {
    if (err) {
      console.log(`%s Error writing YAML: ${err}`, chalk.red.bold("CLI Error"));
      callback(false);
    } else {
      callback(true);
    }
  });
}

exports.writeYAML = writeYAML;

async function writeFile(options, data, output_path, callback) {
  await fs.writeFile(output_path, data, "utf8", err => {
    if (err) {
      console.log(`%s Error writing File: ${err}`, chalk.red.bold("CLI Error"));
      callback(false);
    } else {
      callback(true);
    }
  });
}

exports.writeFile = writeFile;

async function checkDatabaseConnectionCORE(options, callback) {
  let db_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBHost
      : params.docker.services.mysql.host;
  let db_database_core =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBCore
      : params.docker.services.mysql.db_core;
  let db_username =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBUser
      : params.docker.services.mysql.user;
  let db_password =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBPass
      : options.databasePassword;
  let db_port =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBPort
      : params.docker.services.mysql.port + options.port_increment;

  let connection_string = {
    host: db_host,
    database: db_database_core,
    user: db_username,
    password: db_password,
    port: db_port
  };

  const connection = mysql.createConnection(connection_string);

  if (options.debugMode) {
    console.log("DEBUG: Core DB Connection String: ");
    console.log(connection_string);
  }

  const status = new Spinner("Connecting to Database...");
  status.start();
  connection.connect(async function(err) {
    if (err) {
      callback(false);
      console.log("%s Database Connection Failed", chalk.red.bold("error"));
      connection.end();
      await status.stop();
    } else {
      await status.stop();
      console.log(
        "%s Database Connection Established",
        chalk.green.bold("success")
      );
      connection.end();
      callback(true);
    }
  });
}

exports.checkDatabaseConnectionCORE = checkDatabaseConnectionCORE;

async function checkOAuthTablesCORE(options, callback) {
  let db_host =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBHost
      : params.docker.services.mysql.host;
  let db_database_core =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBCore
      : params.docker.services.mysql.db_core;
  let db_username =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBUser
      : params.docker.services.mysql.user;
  let db_password =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBPass
      : options.databasePassword;
  let db_port =
    options.template.toLowerCase() == "deploy"
      ? options.deployDBPort
      : params.docker.services.mysql.port + options.port_increment;

  let connection_string = {
    host: db_host,
    database: db_database_core,
    user: db_username,
    password: db_password,
    port: db_port
  };

  const connection = mysql.createConnection(connection_string);

  if (options.debugMode) {
    console.log("DEBUG: OAuth DB Connection String: ");
    console.log(connection_string);
  }

  const status = new Spinner("Connecting to Database...");
  status.start();
  connection.query("SELECT * FROM oauth_clients", async function(
    err,
    result,
    fields
  ) {
    if (err) {
      console.log("%s Still Initializing Tables", chalk.red.bold("error"));
      await status.stop();
      connection.end();
      callback(false);
    } else {
      console.log("%s OAuth Connection Instantiated", chalk.green.bold("CLI:"));
      await status.stop();
      connection.end();
      callback(true);
    }
  });
}
exports.checkOAuthTablesCORE = checkOAuthTablesCORE;

async function setupDorcasCoreOAuth(options) {
  let host_scheme, host_domain_core, host_domain, host_port_core;

  if (
    options.template.toLowerCase() == "production" ||
    options.template.toLowerCase() == "development"
  ) {
    //determine proper url format for both localhost and dns
    host_scheme =
      options.answers.dns === "dns" ? "https" : params.general.http_scheme;
    host_domain_core =
      options.answers.dns === "dns"
        ? params.docker.services.core_web.subdomain +
          "." +
          options.answers.domain
        : params.general.host;

    host_domain =
      options.answers.dns === "dns"
        ? options.answers.domain
        : params.general.host;
    host_port_core =
      options.answers.dns === "dns"
        ? ""
        : ":" + (params.docker.services.core_web.port + options.port_increment);
  } else {
    //determine proper url format for deploy locations
    host_scheme = "https";
    host_domain_core = options.deployHostCore;
    host_domain = options.deployDomain;
    host_port_core = "";
  }

  let setup_url =
    host_scheme +
    "://" +
    host_domain_core +
    host_port_core +
    "/" +
    params.general.path_core_oauth_setup;

  if (options.debugMode) {
    console.log("DEBUG: OAuth Setup URL: ");
    console.log(setup_url);
  }

  let res = await axios.post(setup_url).catch(err => {
    console.log("Error setting up CORE OAuth: " + chalk.red.bold(`${err}`));
    process.exit(1);
  });
  return res.data;
}

exports.setupDorcasCoreOAuth = setupDorcasCoreOAuth;

async function setupAdminAccount(options, callback) {
  const status = new Spinner("Creating Admin Login Account...");
  status.start();

  let host_scheme, host_domain_core, host_domain, host_port_core;

  if (
    options.template.toLowerCase() == "production" ||
    options.template.toLowerCase() == "development"
  ) {
    //determine proper url format for both localhost and dns
    host_scheme =
      options.answers.dns === "dns" ? "https" : params.general.http_scheme;
    host_domain_core =
      options.answers.dns === "dns"
        ? params.docker.services.core_web.subdomain +
          "." +
          options.answers.domain
        : params.general.host;

    host_domain =
      options.answers.dns === "dns"
        ? options.answers.domain
        : params.general.host;
    host_port_core =
      options.answers.dns === "dns"
        ? ""
        : ":" + (params.docker.services.core_web.port + options.port_increment);
  } else {
    //determine proper url format for deploy locations
    host_scheme = "https";
    host_domain_core = options.deployHostCore;
    host_domain = options.deployDomain;
    host_port_core = "";
  }

  try {
    setTimeout(async () => {
      let data = {};

      let installationPass = "";
      if (
        options.template.toLowerCase() == "production" ||
        options.template.toLowerCase() == "development"
      ) {
        data = {
          firstname: options.answers.firstname,
          lastname: options.answers.lastname,
          email: options.answers.email,
          installer: "true",
          domain: options.answers.domain,
          password: options.answers.password,
          company: options.answers.company,
          phone: options.answers.phone,
          feature_select: options.answers.feature_select,
          client_id: options.clientId,
          client_secret: options.clientSecret
        };
      } else if (options.template.toLowerCase() == "deploy") {
        installationPass = Str.random(12);
        data = {
          firstname: "Admin",
          lastname: "Dorcas",
          email: options.argEmail,
          installer: "true",
          domain: options.deployDomain,
          password: installationPass,
          company: options.deployCompany || "Dorcas Company",
          phone: options.deployCompany || "08123456789",
          feature_select: "all",
          client_id: options.clientId,
          client_secret: options.clientSecret
        };
      }
      let res = await createUser(data, options);
      if (typeof res !== "undefined") {
        await status.stop();
        console.log(
          "%s Account Creation Successful!",
          chalk.green.bold("Success")
        );
        console.log("\n");

        //   let open_domain_localhost =
        //     params.general.http_scheme +
        //     "://" +
        //     params.general.host +
        //     ":" +
        //     (params.docker.services.hub_web.port + options.port_increment);

        //   let open_domain_dns =
        //     (options.answers.dns_resolver === "valet"
        //       ? "https"
        //       : params.general.http_scheme) +
        //     "://" +
        //     options.answers.domain;

        //   let open_domain =
        //     options.answers.dns === "dns"
        //       ? open_domain_dns
        //       : open_domain_localhost;

        let open_url =
          host_scheme +
          "://" +
          host_domain_core +
          host_port_core +
          "/" +
          params.general.path_hub_admin_login;

        //let open_url = open_domain + "/" + params.general.path_hub_admin_login;

        console.log(
          `Dear ${res.firstname} (${res.email}), ` +
            `thank you for installing the Dorcas HUB.\n` +
            ` Visit this URL address ${chalk.green.bold(
              open_url
            )} and login with your ${chalk.green.bold("email")} (${
              res.email
            }) and ${chalk.green.bold("password")} ${installationPass}.`
        );
        console.log("\n");

        callback(true);
      }
    }, 7500);
  } catch (err) {
    await status.stop();
    console.log(chalk.red.bold(`Admin Account Creation Error: ${err}`));
    callback(false);
  }
}

exports.setupAdminAccount = setupAdminAccount;

async function createUser(body, options) {
  let host_scheme, host_domain_core, host_domain, host_port_core;

  if (
    options.template.toLowerCase() == "production" ||
    options.template.toLowerCase() == "development"
  ) {
    //determine proper url format for both localhost and dns
    host_scheme =
      options.answers.dns === "dns" ? "https" : params.general.http_scheme;
    host_domain_core =
      options.answers.dns === "dns"
        ? params.docker.services.core_web.subdomain +
          "." +
          options.answers.domain
        : params.general.host;

    host_domain =
      options.answers.dns === "dns"
        ? options.answers.domain
        : params.general.host;
    host_port_core =
      options.answers.dns === "dns"
        ? ""
        : ":" + (params.docker.services.core_web.port + options.port_increment);
  } else {
    //determine proper url format for deploy locations
    host_scheme = "https";
    host_domain_core = options.deployHostCore;
    host_domain = options.deployDomain;
    host_port_core = "";
  }

  let create_url =
    host_scheme +
    "://" +
    host_domain_core +
    host_port_core +
    "/" +
    params.general.path_core_user_register;

  if (options.debugMode) {
    console.log(
      " %s Admin User Creation String: ",
      chalk.yellow.bold(`DEBUG: `)
    );
    console.log(create_url);
    console.log(body);
  }

  let res = await axios.post(create_url, body).catch(err => {
    console.log(chalk.red.bold(`User Creation Error: ${err}`));
    process.exit();
  });
  return res.data.data;
}
//reg 174 & 148
