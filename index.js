#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const RUNNERS_DIR = path.resolve('./');
const CACHE_DIR = path.resolve('./cache');

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
}

function getNextRunnerNumber() {
    let count = 1;
    while (fs.existsSync(path.join(RUNNERS_DIR, `runner-${count}`))) {
        count++;
    }
    return count;
}

function getRunnerDirectories() {
    return fs.readdirSync(RUNNERS_DIR).filter(dir => dir.startsWith('runner-'));
}

function executeCommand(command, cwd) {
    try {
        execSync(command, { cwd, stdio: 'inherit' });
        console.log(`✔ Command succeeded: ${command}`);
        return true;
    } catch (error) {
        console.error(`✖ Command failed: ${command}`);
        console.error(error.message);
        return false;
    }
}

async function startRunners() {
    const dirs = getRunnerDirectories();
    if (dirs.length === 0) {
        console.log('Error: No runners found. Returning to main menu.');
        return setImmediate(main);
    }
    dirs.forEach(dir => {
        console.log(`Starting ${dir}...`);
        spawn('./run.sh', { cwd: path.join(RUNNERS_DIR, dir), stdio: 'inherit' });
    });
}

async function quitRunners() {
    const dirs = getRunnerDirectories();
    if (dirs.length === 0) {
        console.log('Error: No runners found. Returning to main menu.');
        return setImmediate(main);
    }
    executeCommand('pkill -f run.sh', RUNNERS_DIR);
}

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, answer => resolve(answer)));
}

function cleanupRunner(runnerDir) {
    try {
        fs.rmSync(runnerDir, { recursive: true, force: true });
        console.log(`Cleaned up ${runnerDir}`);
    } catch (err) {
        console.error(`Failed to clean up ${runnerDir}: ${err.message}`);
    }
}

async function addNewRunner() {
    // Load defaults from runners.config.json if it exists
    const configPath = path.resolve('./runners.config.json');
    let configData = {};
    const configExists = fs.existsSync(configPath);
    if (configExists) {
        try {
            configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (err) {
            console.error("Error parsing runners.config.json, using fallback defaults.");
        }
    }
    const defaultVersion = configData.version || '2.322.0';
    const defaultSha = configData.sha || '67d3b4dd6f1eec8ec43dda12c189cff68ec3ba1dfa054791cb446ddcfb39d2aa';
    const defaultName = configData.runnerName || 'ManagedRunner';
    const defaultToken = configData.token; // no fallback default
    const defaultRepo = configData.repo;   // no fallback default
    const defaultPlatform = configData.platform || 'macOS';

    const version = await askQuestion(`Enter version (${defaultVersion}): `) || defaultVersion;
    const sha = await askQuestion(`Enter SHA (${defaultSha}): `) || defaultSha;
    const tokenInput = await askQuestion(`Enter GitHub token${defaultToken ? ` (${defaultToken})` : ''}: `);
    const token = tokenInput || defaultToken;
    if (!token) {
        console.log('Token is required');
        return setImmediate(main);
    }
    const repoInput = await askQuestion(`Enter repo (owner/repo)${defaultRepo ? ` (${defaultRepo})` : ''}: `);
    const repo = repoInput || defaultRepo;
    if (!repo) {
        console.log('Repo is required');
        return setImmediate(main);
    }
    const runnerName = await askQuestion(`Enter runner name (${defaultName}): `) || defaultName;

    // Ask for platform and architecture
    const platformInput = await askQuestion(`Which platform are you running on? (macOS/Linux) (${defaultPlatform}): `);
    const platform = platformInput || defaultPlatform;

    let defaultArch;
    if (platform.toLowerCase() === 'linux') {
        defaultArch = configData.arch || 'x64';
    } else {
        // For macOS
        defaultArch = configData.arch || 'ARM64';
    }
    let archPrompt;
    if (platform.toLowerCase() === 'linux') {
        archPrompt = `Select architecture (x64/ARM/ARM64) (${defaultArch}): `;
    } else {
        archPrompt = `Select architecture (x64/ARM64) (${defaultArch}): `;
    }
    const archInput = await askQuestion(archPrompt);
    const arch = archInput || defaultArch;

    const runnerNumber = getNextRunnerNumber();
    const runnerDir = path.join(RUNNERS_DIR, `runner-${runnerNumber}`);
    fs.mkdirSync(runnerDir);

    // Construct filename based on platform and architecture.
    // For macOS, use "osx" instead of "macos"
    const platformPart = platform.toLowerCase() === 'macos' ? 'osx' : platform.toLowerCase();
    const filename = `actions-runner-${platformPart}-${arch.toLowerCase()}-${version}.tar.gz`;
    const cachedFile = path.join(CACHE_DIR, filename);
    const url = `https://github.com/actions/runner/releases/download/v${version}/${filename}`;
    const checksumCmd = `echo "${sha}  ${filename}" | shasum -a 256 -c`;

    console.log(`Setting up runner-${runnerNumber}...`);

    if (!fs.existsSync(cachedFile)) {
        console.log(`Downloading ${filename}...`);
        if (!executeCommand(`curl -o ${cachedFile} -L ${url}`, CACHE_DIR)) {
            cleanupRunner(runnerDir);
            return setImmediate(main);
        }
    } else {
        console.log(`Using cached ${filename}.`);
    }

    fs.copyFileSync(cachedFile, path.join(runnerDir, filename));

    if (!executeCommand(checksumCmd, runnerDir)) {
        console.error('❌ Failed to validate file checksum.')
        cleanupRunner(runnerDir);
        return setImmediate(main);
    }
    if (!executeCommand(`tar xzf ./${filename}`, runnerDir)) {
        console.error('❌ Failed to extract file.')
        cleanupRunner(runnerDir);
        return setImmediate(main);
    }

    // Cleanup: remove the tarball after extraction
    try {
        fs.unlinkSync(path.join(runnerDir, filename));
        console.log(`Cleaned up ${filename}`);
    } catch (err) {
        console.error(`Failed to remove ${filename}: ${err.message}`);
    }

    const configCmd = `./config.sh --url https://github.com/${repo} --token ${token} --unattended --name ${runnerName}-Runner-${runnerNumber} --labels self-hosted,${platform},${arch}`;
    if (!executeCommand(configCmd, runnerDir)) {
        console.error('❌ Failed to configure runner. Possible reasons: invalid token, invalid repo, or runner name already in use.')
        cleanupRunner(runnerDir);
        return setImmediate(main);
    }

    console.log(`✅ Runner-${runnerNumber} added successfully.`);

    // If no runners.config.json exists, ask the user to save these defaults.
    if (!configExists) {
        const saveDefaults = await askQuestion('👉 Would you like to save these values as defaults in runners.config.json for future use? (yes/no): ');
        if (saveDefaults.trim().toLowerCase() === 'yes' || saveDefaults.trim().toLowerCase() === 'y') {
            const defaults = {
                version,
                sha,
                token,
                repo,
                runnerName,
                platform,
                arch
            };
            try {
                fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2));
                console.log('Defaults saved to runners.config.json');
            } catch (err) {
                console.error('Failed to save defaults:', err.message);
            }
        }
    }

    setImmediate(main);
}

function main() {
    console.log('\nWhat do you want to do?');
    console.log('1. Start runners');
    console.log('2. Quit runners');
    console.log('3. Add new runner');
    rl.question('Select an option: ', async answer => {
        if (answer === '1') await startRunners();
        else if (answer === '2') await quitRunners();
        else if (answer === '3') await addNewRunner();
        else main();
    });
}

main();
