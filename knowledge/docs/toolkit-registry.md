## Why

- **Registry is human-readable and hand-editable**: `toolkit.yaml` is edited by hand (comments, readable); a validator writes JSON for the scripts, so they need no YAML parser. [[zero-dependency-scripts]]
- **Registry records verdict history**: a tool becomes a default only after its docs are read, it is trialled, and the verdict is recorded with evidence.
- **Entries declare how to check and install**: one command per platform, or one `all` command when it's the same everywhere, so copies of a command can't drift apart; `none` when there's nothing to install, so setup never runs a sentence as a command.
