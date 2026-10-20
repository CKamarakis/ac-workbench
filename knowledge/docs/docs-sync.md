## How it works, roughly
Runs inside `/kit:verify`, before archive. It reads the build's apply receipt, the commits since the docs were last edited, the diff and dependency changes, sorts each item (behavior, decision with depth, how the build ran), and writes only what you say yes to.

## Why

- **Docs sync sources**: archive turns a change's specs into the living record, so whatever is wrong at archive becomes the record. On Canvas the docs stopped 29 code commits before the build ended.
