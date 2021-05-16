"use strict";

var params = {
  general: {
    title: "Modullo",
    title_full: "Modullo Framework",
    install_output_folder: "modullo-app",
    deploy_output_folder: "modullo-app",
    create_output_folder: "modullo-create",
    pipeline_output_folder: "modullo-pipeline",
    http_scheme: "http",
    host: "127.0.0.1",
    port: 20030,
    path_core_oauth_setup: "setup",
    path_core_user_register: "register",
    path_hub_admin_login: "login",
    default_domain_production: "modullo-prod.test",
    default_domain_development: "modullo-dev.test"
  },
  installer: {
    available_os: ["win32", "darwin"],
    data: {
      win32: {
        available_software: ["app_name"],
        install_prefix: "choco install ",
        data: {
          app_name: {
            message_success: "success",
            message_error: "error"
          }
        }
      },
      darwin: {
        available_software: ["app_name"],
        install_prefix: "brew install ",
        data: {
          app_name: {
            message_success: "success",
            message_error: "error"
          }
        }
      }
    }
  },
  frameworks: {
    list: ["modullo", "wordpress"],
    data: {
      modullo: {
        name: "Modullo"
      },
      wordpress: {
        name: "Wordpress"
      },
      ansible: {
        name: "Ansible"
      },
      software: {
        name: "Software",
        linux: {
          stacks: ["lemp", "lamp"],
          packages: ["php", "nginx", "apache", "mysql", "custom"]
        }
      }
    }
  },
  infrastructure: {
    list: ["pipeline", "container-registry", "repository", "vm"],
    data: {
      pipeline: {
        name: "Pipeline"
      },
      "container-registry": {
        name: "Container Registry"
      },
      repository: {
        name: "Code Repository"
      }
    }
  },
  platforms: {
    list: ["local", "aws", "azure", "github", "linux"],
    data: {
      local: {
        name: "Local"
      },
      aws: {
        name: "AWS"
      },
      azure: {
        name: "Azure"
      },
      github: {
        name: "Github"
      },
      linux: {
        name: "Linux"
      }
    }
  },
  versions: {
    production: {
      services: [
        "proxy",
        "core_app",
        "core_web",
        "hub_app",
        "hub_web",
        "mysql",
        "redis",
        "smtp"
      ],
      git_repo_core: "modullo/core",
      git_branch_core: "dev",
      git_repo_hub: "modullo/hub",
      git_branch_hub: "dev"
    },
    development: {
      services: [
        "proxy",
        "core_app",
        "core_web",
        "hub_app",
        "hub_web",
        "mysql",
        "redis",
        "smtp"
      ],
      git_repo_core: "modullo/core",
      git_branch_core: "dev",
      git_repo_hub: "modullo/hub",
      git_branch_hub: "dev"
    }
  },
  docker: {
    services: {
      proxy: {
        name: "modullo_proxy",
        port: 20030,
        image: "jwilder/nginx-proxy"
      },
      core_app: {
        name: "modullo_core_app",
        port: 20031,
        image: "modullo/hub:dev",
        working_dir: "/var/www/modullo-core",
        env_file: "./app/env_core_production",
        volumes_env: "./app/env_core_production:/var/www/modullo-core/.env",
        volumes_php_ini: "./app/local.ini:/usr/local/etc/php/conf.d/local.ini"
      },
      core_web: {
        subdomain: "core",
        name: "modullo_core_web",
        port: 20032
      },
      hub_app: {
        name: "modullo_hub_app",
        port: 20033,
        image: "modullo/hub:dev",
        working_dir: "/var/www/modullo-hub",
        env_file: "./app/env_hub_production",
        volumes_env: "./app/env_hub_production:/var/www/modullo-hub/.env",
        volumes_php_ini: "./app/local.ini:/usr/local/etc/php/conf.d/local.ini"
      },
      hub_web: {
        subdomain: "hub",
        name: "modullo_hub_web",
        port: 20034
      },
      mysql: {
        subdomain: "mysql",
        name: "modullo_mysql",
        port: 20035,
        host: "127.0.0.1",
        user: "root",
        password: "P@sSW0rD",
        db_core: "modullo_core",
        db_hub: "modullo_hub"
      },
      redis: {
        subdomain: "redis",
        name: "modullo_redis",
        port: 20036,
        image: "redis:5.0-alpine"
      },
      smtp: {
        subdomain: "smtp",
        name: "modullo_smtp",
        port: 20037,
        port_2: 20038,
        image: "mailhog/mailhog:latest"
      },
      reloader: {
        name: "modullo_reloader",
        port: 20039,
        image: ""
      }
    }
  }
};

module.exports = params;
