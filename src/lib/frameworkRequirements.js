const path = require("path");
const wordpress = require(path.join(
  __dirname,
  "../frameworks/wordpress/Wordpress.js"
));

const modullo = require(path.join(
  __dirname,
  "../frameworks/modullo/Modullo.js"
));

function getArgs() {
  return {};
}
exports.getArgs = getArgs;

function getOptions(args) {
  return {};
}
exports.getOptions = getOptions;

async function checkRequirements(options, service = "") {
  if (options.installFramework == "wordpress") {
    optionsFramework = await wordpress.cliRequirements(options); // require specific Wordpress CLI requirements
    // wordpress.createInit(options);
    return optionsFramework;
  }
  if (options.installFramework == "modullo") {
    optionsFramework = await modullo.cliRequirements(options); // require specific Wordpress CLI requirements
    // wordpress.createInit(options);
    return optionsFramework;
  }
}

exports.checkRequirements = checkRequirements;
