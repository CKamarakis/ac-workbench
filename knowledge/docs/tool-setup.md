## Why

- **Workflow plugins are never enabled globally**: you work in repos you don't own; kit tools must be active only where the kit set the project up. [[tools-per-project]]
- **Missing Homebrew is reported, not installed**: installing Homebrew needs you (an admin password, prompts); the kit only points to brew.sh.
- **Setup uses the current platform's install command**: macOS and Linux both use Homebrew, one tested command set, rather than per-distro packages that can't be tested here.
