# @rvanbaalen/runner-manager

A CLI tool to manage GitHub self-hosted runners on your machine.

# Installation

`npm install -g @rvanbaalen/runner-manager`

# Usage

Run the CLI with:

`runner-manager`

You’ll be presented with a menu:
- Start runners – Starts all configured runners.
- Quit runners – Stops all running runners.
- Add new runner – Guides you through setting up a new runner.

Adding a New Runner

The CLI will prompt you for several inputs:
- **Version**: GitHub Actions Runner version (default: 2.322.0).
- **SHA**: Checksum for the runner package.
- **GitHub Token**: Your GitHub token (required).
- **Repo**: The repository in owner/repo format (required).
- **Runner Name**: A custom name for the runner.
- **Platform**: Your operating system (macOS or Linux, default: macOS).
- **Architecture**:
- **For macOS**: Options are x64 or ARM64 (default: ARM64).
- **For Linux**: Options are x64, ARM, or ARM64 (default: x64).

Based on these inputs, the CLI downloads the appropriate runner tarball using the following pattern:

`actions-runner-[osx/linux]-[lowercase architecture]-[version].tar.gz`

# Configuration Defaults

If a runners.config.json file is present in the current directory, its values will be used as defaults. Otherwise, after adding a new runner, you’ll be prompted to save the current settings as defaults in a new runners.config.json file for future use.

# Cleanup

If any command fails during runner setup, the script automatically cleans up by removing the runner folder.

# License

See LICENSE file

Happy self-hosting! 🤖
 
