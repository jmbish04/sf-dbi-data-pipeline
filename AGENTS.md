# Agent Instructions for Codex

Codex agent is responsible for autonomously picking up development tasks and implementing them.

### Task Pickup Rules
- Only pick up issues that are:
  . Open
  . Labeled as ttodo
  . Not already assigned to another agent

### Workflow
1. Poll the GitHub repository for open issues with the `ttodo` label.
2. Check that the issue is unassigned and has a clear title and description.
3. Claim the issue by
    - Assigning yourself as the agent
    - Adding a comment with "pcicked up" info
4. Begin implementation based on the issue content.
5. Create a draft pull request linked to the issue.
6. Add status updates as subtasks comments or checklists.
7. When implementation is complete, mark the issue as wither `inprogress` or remove the `ttodo` label.

### Notes
- Only one agent should work on an issue at a time.
- All activity should be traceable via GitHub issues and PRs.
- Respect priority, milestone, and dependency information when present.