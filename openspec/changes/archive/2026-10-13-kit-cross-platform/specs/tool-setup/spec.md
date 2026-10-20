# Spec Delta

## MODIFIED Requirements

### Requirement: Tools outside PATH are detected
Setup SHALL treat a tool as present when it is installed in a known location outside the shell's PATH (such as the global npm folder or its standard install folder), and SHALL use that location rather than reinstalling. On macOS and Linux the known locations SHALL include the Homebrew folders (`/opt/homebrew/bin`, `/usr/local/bin`, `/home/linuxbrew/.linuxbrew/bin`) and `~/.local/bin`.

#### Scenario: GitHub CLI installed but not on PATH
- **WHEN** the GitHub CLI is installed in its standard folder but not on the Git Bash PATH
- **THEN** setup reports it as present and does not reinstall it

#### Scenario: Homebrew tool not on PATH
- **GIVEN** a Mac where `gitleaks` is in `/opt/homebrew/bin` and that folder is not on the shell's PATH
- **WHEN** setup runs
- **THEN** it reports gitleaks as present and does not reinstall it

## ADDED Requirements

### Requirement: Setup uses the current platform's install command
Setup, the project starter and the prerequisite check SHALL take a tool's install command from the registry entry for the current platform, falling back to the entry's `all` command. On Windows the commands SHALL stay as they are today.

#### Scenario: Mac install
- **GIVEN** a Mac with Homebrew and without `jq`
- **WHEN** the user runs `/kit:setup` and confirms
- **THEN** setup runs `brew install jq` and lists jq as installed

#### Scenario: Same command everywhere
- **GIVEN** a Linux machine without OpenSpec, and an OpenSpec entry with only an `all` install command
- **WHEN** setup runs
- **THEN** it installs OpenSpec with that command

### Requirement: Missing Homebrew is reported, not installed
On macOS and Linux, when a missing tool's install command needs Homebrew and Homebrew isn't installed, setup SHALL NOT try to install Homebrew. It SHALL list the tool as failed with the hint to install Homebrew from https://brew.sh and re-run setup, and SHALL continue with the other tools.

#### Scenario: Mac without Homebrew
- **GIVEN** a Mac without Homebrew, missing `gh` and OpenSpec
- **WHEN** setup runs
- **THEN** gh fails with "install Homebrew from https://brew.sh, then re-run /kit:setup", and OpenSpec is still installed through npm
