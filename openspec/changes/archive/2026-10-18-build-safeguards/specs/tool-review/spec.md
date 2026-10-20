# Spec Delta

## Purpose

Keeps the kit's tools known to be current and working: a regular review shows what changed for each tool and what to do, and the user decides; nothing updates on release.

## ADDED Requirements

### Requirement: Tool review
`/kit:tool-review` SHALL check every registry entry with status `adopted` or `trial` and show, per tool:
- whether its source still exists;
- the latest version available, next to its `reviewed_version`, and whether that is a major version change;
- for a major version change, the release notes, read before any update is proposed;
- what is new that the kit could use (new skills, commands or options that fit a lane), as a short list;
- a recommendation: **update**, **hold** or **drop**, with the reason.

A tool whose latest version can't be found SHALL be shown as "unknown", with the reason, never as up to date.

#### Scenario: One tool behind
- **GIVEN** a tool's `reviewed_version` is 6.4.2 and its latest release is 7.0.0
- **WHEN** I run `/kit:tool-review`
- **THEN** the tool is listed as a major version behind, its release notes are summarised, and the recommendation names what would change for the kit

#### Scenario: Source gone
- **WHEN** a tool's source repository or package no longer exists
- **THEN** the tool is listed as "source not found", with the recommendation drop or replace

#### Scenario: Version not found
- **WHEN** the latest version can't be read (no network, rate limit)
- **THEN** the tool is listed as "unknown" with the reason, and the other tools are still checked

### Requirement: The user decides each update
Nothing SHALL be installed, updated or dropped without the user's yes per tool. On **update**, the review SHALL follow the project's tool-update steps: update the tool, run the smoke test, and only when it passes set `reviewed_version` and `reviewed_on`. On **hold**, it SHALL set only `reviewed_on`, so the reminder counts from this review. On **drop**, it SHALL record a `dropped` verdict with the reason, and SHALL offer uninstalling the tool as a separate question.

#### Scenario: Update with a failing smoke test
- **GIVEN** I chose update for a tool
- **WHEN** the smoke test fails after the update
- **THEN** `reviewed_version` stays as it was, and I'm told the failure and offered to roll the tool back

#### Scenario: Drop
- **WHEN** I choose drop for a tool
- **THEN** the registry records a `dropped` verdict with my reason, and uninstalling the tool is offered as a separate question; nothing is uninstalled without a yes

#### Scenario: Hold
- **WHEN** I choose hold for a tool that is one version behind
- **THEN** only its `reviewed_on` date changes

### Requirement: Review reminder at session start
At session start, in a project that holds the tool registry (`toolkit.yaml`), the kit SHALL show one line when the oldest `reviewed_on` date among adopted and trial tools is more than 30 days old: "Tool review due (oldest: <tool>, <days> days): run `/kit:tool-review`". The reminder SHALL make no network call, SHALL say nothing when no review is due, and SHALL do nothing in other projects.

#### Scenario: Review due
- **GIVEN** the oldest `reviewed_on` is 42 days ago
- **WHEN** a session starts
- **THEN** I see one line naming that tool and `/kit:tool-review`

#### Scenario: Not due
- **GIVEN** every `reviewed_on` is within 30 days
- **WHEN** a session starts
- **THEN** the reminder shows nothing

#### Scenario: Other project
- **WHEN** a session starts in a project without `toolkit.yaml`
- **THEN** the reminder shows nothing
