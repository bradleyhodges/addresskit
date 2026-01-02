#!/usr/bin/env node
/**
 * AddressKit Release Script
 *
 * Builds and publishes the package to all registries:
 * - npm (npmjs.com)
 * - GitHub Packages (npm.pkg.github.com)
 * - Docker Hub (bradleyhodges/addresskit)
 * - GitHub Container Registry (ghcr.io/bradleyhodges/addresskit)
 *
 * Usage:
 *   node tooling/scripts/release.js [options]
 *
 * Options:
 *   --skip-npm       Skip npm publish
 *   --skip-github    Skip GitHub npm publish
 *   --skip-docker    Skip Docker Hub publish
 *   --skip-ghcr      Skip GitHub Container Registry publish
 *   --skip-git-tag   Skip git tag creation
 *   --dry-run        Show what would be done without executing
 *
 * Environment Variables Required:
 *   DOCKER_ID_USER   - Docker Hub username
 *   DOCKER_ID_PASS   - Docker Hub password/token
 *   GITHUB_TOKEN     - GitHub PAT with write:packages scope (for GHCR)
 *
 * @module release
 */

const { execSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");

// ANSI color codes for terminal output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

/**
 * Logs a styled message to the console.
 *
 * @param {string} emoji - Emoji prefix for the message.
 * @param {string} message - The message to display.
 * @param {string} [color] - ANSI color code.
 */
function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

/**
 * Logs a section header.
 *
 * @param {string} title - Section title.
 */
function logSection(title) {
    console.log();
    console.log(
        `${colors.cyan}${colors.bright}━━━ ${title} ━━━${colors.reset}`,
    );
    console.log();
}

/**
 * Executes a shell command with proper error handling.
 *
 * @param {string} cmd - The command to execute.
 * @param {Object} [options] - Execution options.
 * @param {boolean} [options.silent] - Suppress stdout.
 * @param {boolean} [options.ignoreError] - Don't throw on error.
 * @returns {string} Command output.
 * @throws {Error} If command fails and ignoreError is false.
 */
function exec(cmd, options = {}) {
    const { silent = false, ignoreError = false } = options;

    log("▶", cmd, colors.dim);

    if (args.dryRun) {
        log("⏭", "(dry run - skipped)", colors.yellow);
        return "";
    }

    try {
        const output = execSync(cmd, {
            encoding: "utf8",
            stdio: silent ? "pipe" : "inherit",
            cwd: projectRoot,
        });
        return output || "";
    } catch (error) {
        if (ignoreError) {
            log(
                "⚠",
                `Command failed (ignored): ${error.message}`,
                colors.yellow,
            );
            return "";
        }
        throw error;
    }
}

/**
 * Parses command line arguments.
 *
 * @returns {Object} Parsed arguments.
 */
function parseArgs() {
    const argv = process.argv.slice(2);
    return {
        skipNpm: argv.includes("--skip-npm"),
        skipGithub: argv.includes("--skip-github"),
        skipDocker: argv.includes("--skip-docker"),
        skipGhcr: argv.includes("--skip-ghcr"),
        skipGitTag: argv.includes("--skip-git-tag"),
        dryRun: argv.includes("--dry-run"),
        help: argv.includes("--help") || argv.includes("-h"),
    };
}

/**
 * Displays help information.
 */
function showHelp() {
    console.log(`
${colors.bright}AddressKit Release Script${colors.reset}

Builds and publishes the package to all registries.

${colors.cyan}Usage:${colors.reset}
  node tooling/scripts/release.js [options]
  pnpm release:all [options]

${colors.cyan}Options:${colors.reset}
  --skip-npm       Skip npm publish
  --skip-github    Skip GitHub npm publish
  --skip-docker    Skip Docker Hub publish
  --skip-ghcr      Skip GitHub Container Registry publish
  --skip-git-tag   Skip git tag creation
  --dry-run        Show what would be done without executing
  --help, -h       Show this help message

${colors.cyan}Environment Variables:${colors.reset}
  DOCKER_ID_USER   Docker Hub username
  DOCKER_ID_PASS   Docker Hub password/token
  GITHUB_TOKEN     GitHub PAT with write:packages scope

${colors.cyan}Examples:${colors.reset}
  # Full release to all registries
  pnpm release:all

  # Skip Docker registries
  pnpm release:all --skip-docker --skip-ghcr

  # Dry run to see what would happen
  pnpm release:all --dry-run
`);
}

/**
 * Validates required environment variables for Docker publishing.
 *
 * @param {Object} args - Parsed arguments.
 * @returns {Object} Validation result with missing variables.
 */
function validateEnv(args) {
    const missing = [];

    if (!args.skipDocker) {
        if (!process.env.DOCKER_ID_USER) missing.push("DOCKER_ID_USER");
        if (!process.env.DOCKER_ID_PASS) missing.push("DOCKER_ID_PASS");
    }

    if (!args.skipGhcr) {
        if (!process.env.GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
    }

    return { valid: missing.length === 0, missing };
}

// Project root directory
const projectRoot = path.resolve(__dirname, "../..");

// Parse arguments
const args = parseArgs();

// Show help if requested
if (args.help) {
    showHelp();
    process.exit(0);
}

// Read package.json
const pkg = JSON.parse(
    readFileSync(path.join(projectRoot, "package.json"), "utf8"),
);
const version = pkg.version;
const packageName = pkg.name;
const tarballName = `bradleyhodges-addresskit-${version}.tgz`;

/**
 * Main release function.
 */
async function release() {
    console.log();
    console.log(
        `${colors.magenta}${colors.bright}╔════════════════════════════════════════════╗${colors.reset}`,
    );
    console.log(
        `${colors.magenta}${colors.bright}║     AddressKit Release v${version.padEnd(17)}║${colors.reset}`,
    );
    console.log(
        `${colors.magenta}${colors.bright}╚════════════════════════════════════════════╝${colors.reset}`,
    );

    if (args.dryRun) {
        log("🧪", "DRY RUN MODE - No changes will be made", colors.yellow);
    }

    // Validate environment
    const envCheck = validateEnv(args);
    if (!envCheck.valid) {
        log(
            "⚠",
            `Missing environment variables: ${envCheck.missing.join(", ")}`,
            colors.yellow,
        );
        log("", "Some publish steps may be skipped.", colors.yellow);
    }

    // Step 1: Build
    logSection("Building Package");
    log("📦", `Building ${packageName}@${version}...`, colors.blue);
    exec("pnpm run build");
    log("✓", "Build complete", colors.green);

    // Step 2: License check
    logSection("License Check");
    log("📋", "Checking licenses...", colors.blue);
    exec("pnpm run check-licenses");
    log("✓", "License check passed", colors.green);

    // Step 3: Create tarball
    logSection("Creating Package Tarball");
    log("📦", `Creating ${tarballName}...`, colors.blue);
    exec("npm pack");
    log("✓", "Tarball created", colors.green);

    // Step 4: Publish to npm
    if (!args.skipNpm) {
        logSection("Publishing to npm");
        log("📤", "Publishing to npmjs.com...", colors.blue);
        exec("npm publish --access public");
        log("✓", "Published to npm", colors.green);
    } else {
        log("⏭", "Skipping npm publish", colors.yellow);
    }

    // Step 5: Publish to GitHub npm
    if (!args.skipGithub) {
        logSection("Publishing to GitHub Packages");
        log("📤", "Publishing to npm.pkg.github.com...", colors.blue);
        exec(
            "npm publish --access public --registry=https://npm.pkg.github.com",
        );
        log("✓", "Published to GitHub Packages", colors.green);
    } else {
        log("⏭", "Skipping GitHub npm publish", colors.yellow);
    }

    // Step 6: Build Docker image for Docker Hub
    if (!args.skipDocker) {
        logSection("Building Docker Image (Docker Hub)");
        log("🐳", "Building Docker image...", colors.blue);
        exec(
            `docker build -f infra/docker/Dockerfile --build-arg PACKAGE_TGZ=${tarballName} --build-arg PACKAGE=${packageName} --build-arg VERSION=${version} -t bradleyhodges/addresskit:${version} -t bradleyhodges/addresskit:latest .`,
        );
        log("✓", "Docker image built", colors.green);

        logSection("Pushing to Docker Hub");
        if (process.env.DOCKER_ID_USER && process.env.DOCKER_ID_PASS) {
            log("🔐", "Logging in to Docker Hub...", colors.blue);
            exec(
                `echo ${process.env.DOCKER_ID_PASS} | docker login --username ${process.env.DOCKER_ID_USER} --password-stdin`,
                { silent: true },
            );
            log("📤", "Pushing to Docker Hub...", colors.blue);
            exec(`docker push bradleyhodges/addresskit:${version}`);
            exec("docker push bradleyhodges/addresskit:latest");
            log("✓", "Pushed to Docker Hub", colors.green);
        } else {
            log(
                "⚠",
                "Docker credentials not set, skipping push",
                colors.yellow,
            );
        }
    } else {
        log("⏭", "Skipping Docker Hub", colors.yellow);
    }

    // Step 7: Build and push to GHCR
    if (!args.skipGhcr) {
        logSection("Building Docker Image (GHCR)");
        log("🐳", "Building Docker image for GHCR...", colors.blue);
        exec(
            `docker build -f infra/docker/Dockerfile --build-arg PACKAGE_TGZ=${tarballName} --build-arg PACKAGE=${packageName} --build-arg VERSION=${version} -t ghcr.io/bradleyhodges/addresskit:${version} -t ghcr.io/bradleyhodges/addresskit:latest .`,
        );
        log("✓", "Docker image built for GHCR", colors.green);

        logSection("Pushing to GitHub Container Registry");
        if (process.env.GITHUB_TOKEN) {
            log("🔐", "Logging in to GHCR...", colors.blue);
            exec(
                `echo ${process.env.GITHUB_TOKEN} | docker login ghcr.io -u bradleyhodges --password-stdin`,
                { silent: true },
            );
            log("📤", "Pushing to GHCR...", colors.blue);
            exec(`docker push ghcr.io/bradleyhodges/addresskit:${version}`);
            exec("docker push ghcr.io/bradleyhodges/addresskit:latest");
            log("✓", "Pushed to GHCR", colors.green);
        } else {
            log("⚠", "GITHUB_TOKEN not set, skipping GHCR push", colors.yellow);
        }
    } else {
        log("⏭", "Skipping GHCR", colors.yellow);
    }

    // Step 8: Create git tag
    if (!args.skipGitTag) {
        logSection("Creating Git Tag");
        log("🏷", `Creating tag v${version}...`, colors.blue);
        exec(`git tag v${version}`, { ignoreError: true });
        exec("git push origin master --tags", { ignoreError: true });
        log("✓", "Git tag created and pushed", colors.green);
    } else {
        log("⏭", "Skipping git tag", colors.yellow);
    }

    // Done!
    console.log();
    console.log(
        `${colors.green}${colors.bright}╔════════════════════════════════════════════╗${colors.reset}`,
    );
    console.log(
        `${colors.green}${colors.bright}║           Release Complete! 🎉             ║${colors.reset}`,
    );
    console.log(
        `${colors.green}${colors.bright}╚════════════════════════════════════════════╝${colors.reset}`,
    );
    console.log();
    log("📦", `npm: https://www.npmjs.com/package/${packageName}`, colors.cyan);
    log(
        "📦",
        `GitHub: https://github.com/bradleyhodges/addresskit/pkgs/npm/addresskit`,
        colors.cyan,
    );
    log(
        "🐳",
        `Docker Hub: https://hub.docker.com/r/bradleyhodges/addresskit`,
        colors.cyan,
    );
    log("🐳", `GHCR: https://ghcr.io/bradleyhodges/addresskit`, colors.cyan);
    console.log();
}

// Run the release
release().catch((error) => {
    log("✖", `Release failed: ${error.message}`, colors.red);
    process.exit(1);
});
