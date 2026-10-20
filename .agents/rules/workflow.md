# Workflow

Read this for all repository work.

- Use `mise tasks` and `mise run <task>`. Put multi-command tasks in `.mise/tasks/`.
- Install hooks with `mise run hooks:install`.
- Commit subjects use `<scope>: <description>`, with the changed area as scope. Do not use feat/fix types or Signed-off-by.
- Do not amend or force-push without explicit authorization. Authorized force-pushes use --force-with-lease.
- Never commit secrets, environment files, dependencies, or local reports.
- Use gh for GitHub. Write long bodies with --body-file. Publish issues, PRs, comments, tags, and releases only within user authorization.
- Each PR has one purpose, an issue reference or a reason for no issue, exact checks, and remaining risks.
- Merge only with authorization. Test the reviewed head with the current target branch. Use gh pr merge --match-head-commit with that head.
- Setup and passing checks do not authorize publication.
