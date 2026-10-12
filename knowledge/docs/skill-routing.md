## How it works, roughly
The lane map gives each workflow phase exactly one owning tool, worked out from the registry. `/kit:next` reads the project's PRDs and OpenSpec state and names the next step with its owner.

## Why

- **Lane map derived from registry**: overlapping tools (OpenSpec and SuperSpec, for example) don't compete, and adding a tool changes the map through data, not code.
