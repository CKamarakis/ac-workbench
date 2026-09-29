# Spec Delta

## Purpose

Lets the user report kit improvements from inside any project, at the moment they notice them, with context captured automatically, so the kit improves from real use without re-explaining or editing the kit from the wrong place.

## ADDED Requirements

### Requirement: Feedback captures context automatically
When invoked in a consuming project, the feedback skill SHALL record:
- the user's description
- the project name and path
- the project's kit version
- the kit component concerned (if identifiable)
- relevant file paths
- a short summary of what happened in the session

The user SHALL confirm the text before it is filed.

#### Scenario: Feedback with context
- **WHEN** the user runs the feedback skill and says "the starter overwrote nothing but asked too many questions"
- **THEN** the drafted item includes the description, project, kit version and component `project-starter`, and is shown for confirmation

### Requirement: Feedback goes to the kit inbox
Confirmed feedback SHALL be filed as an issue labelled `feedback` in the kit inbox: a private repository separate from the kit repository, which is public. It SHALL NOT change any file in the kit repository or in the consuming project.

#### Scenario: Filed as issue
- **WHEN** the user confirms a feedback draft
- **THEN** an issue labelled `feedback` exists in the private inbox repository and its link is shown

#### Scenario: Inbox is not private
- **WHEN** the configured inbox repository is public
- **THEN** the skill does not file the issue, saves the draft locally, and tells the user the inbox must be private

#### Scenario: No kit edits from projects
- **WHEN** feedback is filed from a consuming project
- **THEN** no commit or file change is made to the kit repository

### Requirement: Offline or missing tooling falls back safely
If the inbox cannot be reached (no network, or the GitHub CLI is missing or not signed in), the skill SHALL save the draft to a local pending file and report how to file it later. Feedback SHALL NOT be lost.

#### Scenario: GitHub CLI missing
- **WHEN** the GitHub CLI is not installed
- **THEN** the draft is saved locally and the user is told how to install the CLI and file pending items

### Requirement: Sensitive content is excluded
The skill SHALL NOT include file contents, secrets or environment values in the filed item. It SHALL include file paths only, and SHALL show the final text before filing.

#### Scenario: Secret in session
- **WHEN** the session context contains an API key
- **THEN** the drafted item does not contain it
