// tslint:disable
import * as path from "path";
import * as minimist from "minimist";
import launch, { EnvFile } from "./launch-base";

const options = minimist(process.argv.slice(2));
const PWD = path.resolve(__dirname, "../");
const bindPort = options.port || process.env.BIND_PORT || 8080;
const nodePort = options["node-port"] || process.env.NODE_PORT || 3000;
const debugPort = options["debug-port"] || process.env.NODE_DEBUG_PORT || 9229;
const dbPort = options["db-port"] || process.env.POSTGRES_PORT || 5432;

const { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT } = process.env;
process.env.DATABASE_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

const APP_CONTAINER_NAME = "app_docker_shell";

let activeContainerName;
(async () => {
    // Start database container
    const dbName = "postgres";
    const isDbContainerRunning = await isContainerRunning(dbName);
    const isDbcontainerExist = !isDbContainerRunning ? await isContainerExist(dbName) : false;
    if (!isDbContainerRunning) {
        if (isDbcontainerExist) {
            await removeContainer(dbName);
        }
        await launch({
            cmds: [
                "docker",
                "run",
                "-d",
                `--env-file=${EnvFile}`,
                `-v=${PWD}:/app`,
                "-it",
                `-p=${dbPort}:${dbPort}`,
                "--name",
                dbName,
                dbName
            ],
            dontExit: true
        });
    }

    if (options["init-db"]) {
        if (!options.source) {
            console.error("Please provide --source=DATABASE_URL");
            process.exit(1);
            return;
        }
        const containerName = "app_init_db";
        activeContainerName = containerName;
        const _isContainerRunning = await isContainerRunning(containerName);
        const _isContainerExist = !_isContainerRunning ? await isContainerExist(containerName) : false;
        if (_isContainerRunning) {
            await stopContainer(containerName);
        }
        if (_isContainerExist) {
            await removeContainer(containerName);
        }
        const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB } = process.env;
        const destination = options.destination
            ? []
            : [
                  "--destination",
                  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`
              ];
        launch({
            cmds: [
                "docker",
                "run",
                `-e`,
                `NODE_ENV=${process.env.NODE_ENV}`,
                `--env-file=${EnvFile}`,
                `-v=${PWD}:/app`,
                "-it",
                "--hostname",
                "app.local",
                "--link",
                "postgres:postgres",
                "--name",
                containerName,
                "app_node",
                "/app/scripts/pull-db.ts",
                ...destination,
                ...process.argv.slice(3)
            ]
        });
    } else if (options["yarn"]) {
        const containerName = APP_CONTAINER_NAME;
        activeContainerName = containerName;
        const _isContainerRunning = await isContainerRunning(containerName);
        const _isContainerExist = !_isContainerRunning ? await isContainerExist(containerName) : false;

        if (_isContainerRunning) {
            await stopContainer(containerName);
            await removeContainer(containerName);
        } else if (_isContainerExist) {
            await removeContainer(containerName);
        }

        launch({
            cmds: [
                "docker",
                "run",
                "-it",
                `--env-file=${EnvFile}`,
                `-e`,
                `NODE_ENV=${process.env.NODE_ENV}`,
                `-e`,
                `DATABASE_URL=${process.env.DATABASE_URL}`,
                `-v=${PWD}:/app`,
                `-p=${bindPort}:${nodePort}`,
                `-p=${debugPort}:${debugPort}`,
                "--link",
                "postgres:postgres",
                "--hostname",
                "app.local",
                "--name",
                containerName,
                "app_node",
                "yarn",
                options["yarn"],
                ...process.argv.slice(3)
            ]
        });
    } else if (options["npm"]) {
        const containerName = APP_CONTAINER_NAME;
        activeContainerName = containerName;
        const _isContainerRunning = await isContainerRunning(containerName);
        const _isContainerExist = !_isContainerRunning ? await isContainerExist(containerName) : false;

        if (_isContainerRunning) {
            await stopContainer(containerName);
            await removeContainer(containerName);
        } else if (_isContainerExist) {
            await removeContainer(containerName);
        }

        launch({
            cmds: [
                "docker",
                "run",
                "-it",
                `--env-file=${EnvFile}`,
                `-e`,
                `NODE_ENV=${process.env.NODE_ENV}`,
                `-e`,
                `DATABASE_URL=${process.env.DATABASE_URL}`,
                `-e`,
                `DEBUG_PORT=${debugPort}`,
                `-v=${PWD}:/app`,
                `-p=${bindPort}:${nodePort}`,
                `-p=${debugPort}:${debugPort}`,
                "--link",
                "postgres:postgres",
                "--hostname",
                "app.local",
                "--name",
                containerName,
                "app_node",
                "npm",
                "run",
                options["npm"],
                ...process.argv.slice(3)
            ]
        });
    } else {
        const containerName = APP_CONTAINER_NAME;
        activeContainerName = containerName;
        const _isContainerRunning = await isContainerRunning(containerName);
        const _isContainerExist = !_isContainerRunning ? await isContainerExist(containerName) : false;

        if (_isContainerRunning) {
            await stopContainer(containerName);
            await removeContainer(containerName);
        } else if (_isContainerExist) {
            await removeContainer(containerName);
        }

        const noneDockerArguments = ["--debug-port"];
        const passThroughArguments = process.argv
            .slice(2)
            .filter(arg => noneDockerArguments.indexOf(arg.split("=")[0]) === -1);

        launch({
            cmds: [
                "docker",
                "run",
                "-it",
                `--env-file=${EnvFile}`,
                `-e`,
                `NODE_ENV=${process.env.NODE_ENV}`,
                `-e`,
                `DATABASE_URL=${process.env.DATABASE_URL}`,
                `-e`,
                `DEBUG_PORT=${debugPort}`,
                `-v=${PWD}:/app`,
                `-p=${bindPort}:${nodePort}`,
                `-p=${debugPort}:${debugPort}`,
                "--link",
                "postgres:postgres",
                "--hostname",
                "app.local",
                "--name",
                containerName,
                ...passThroughArguments,
                "app_node"
            ]
        });
    }
})();

async function exit(code) {
    if (activeContainerName) {
        await launch({
            cmds: ["docker", "stop", activeContainerName]
        });
        await launch({
            cmds: ["docker", "rm", activeContainerName]
        });
    }
}

process.on("SIGINT", <any>exit);

async function getContainerId(name) {
    const containerId = await launch({
        cmds: [
            "docker",
            "ps",
            "-aq",
            "-f",
            "status=exited",
            "-f",
            "status=running",
            "-f",
            "status=created",
            "-f",
            "name=" + name
        ],
        stdio: null,
        shell: false,
        silent: true,
        dontExit: true
    });
    return containerId;
}

async function isContainerRunning(name) {
    const runningContainerId = await launch({
        cmds: ["docker", "ps", "-q", "-f", "name=" + name],
        stdio: null,
        shell: false,
        silent: true,
        dontExit: true
    });
    console.info(`[${name}] Running container ID:${runningContainerId || null}`);
    return runningContainerId !== "";
}
async function isContainerExist(name) {
    const exitedContainerId = await launch({
        cmds: ["docker", "ps", "-aq", "-f", "status=exited", "-f", "status=created", "-f", "name=" + name],
        stdio: null,
        shell: false,
        silent: true,
        dontExit: true
    });
    console.info(`[${name}] Exited container ID:${exitedContainerId || null}`);
    return exitedContainerId !== "";
}
async function removeContainer(name) {
    await launch({
        cmds: ["docker", "rm", name],
        stdio: null,
        shell: false,
        silent: true,
        dontExit: true
    });
}
async function startContainer(name) {
    await launch({
        cmds: ["docker", "start", name],
        stdio: null,
        shell: false,
        silent: true,
        dontExit: true
    });
}
async function stopContainer(name) {
    await launch({
        cmds: ["docker", "stop", name],
        stdio: null,
        shell: false,
        silent: true,
        dontExit: true
    });
}
async function attachContainer(name) {
    await launch({
        cmds: ["docker", "attach", name],
        silent: true
    });
}
