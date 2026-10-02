# Git Workflow Rules — Pravaha

**Remote:** `origin` → `https://github.com/Monolithic-Dev/Pravaha.git` (moved here from the HackIndia-provisioned repo on Oct 2; see Repo Setup Notes)
**Default branch:** `main` — always deployable (Vercel production deploys from it).

These rules apply to every contributor — human or AI assistant.

## The Loop — one feature, one branch, one PR

```bash
# 1. Start from an up-to-date main
git checkout main
git pull --ff-only origin main

# 2. Branch per feature
git checkout -b feature/<feature-name>

# 3. Small, conventional commits on the branch
git add <files>
git commit -m "feat(ask): validate citations against retrieved segments"

# 4. Push and open a PR into main
git push -u origin feature/<feature-name>
gh pr create --base main --title "feat(ask): grounded answers with clip citations" --body-file <pr-body.md>

# 5. CI green + Vercel preview works → merge (merge commit), delete the branch
gh pr merge --merge --delete-branch

# 6. Bring local main up to date — every time, immediately
git checkout main
git pull --ff-only origin main
git branch -d feature/<feature-name>   # if it still exists locally
```

Then start the next feature from step 1. Never start a branch from a stale `main`.

## Branch Names

| Prefix | Use | Example |
|---|---|---|
| `feature/` | Any product feature or phase | `feature/studio-upload` |
| `fix/` | Bug fix | `fix/webhook-duplicate-delivery` |
| `docs/` | Documentation only | `docs/v2-plan` |
| `chore/` | Tooling, deps, CI | `chore/eslint-flat-config` |

Lowercase, kebab-case, describes the feature — not a person or a date.

## Planned Branches (one per phase — `IMPLEMENTATION_PLAN.md`)

| Phase | Branch |
|---|---|
| v2 docs + plan | `docs/v2-plan` |
| 01 | `feature/cloudinary-spike` |
| 02 | `feature/app-shell-deploy` |
| 03 | `feature/studio-upload` |
| 04 | `feature/watch-page` |
| 05 | `feature/ingest-webhook` |
| 06 | `feature/find` |
| 07 | `feature/library-moments` |
| 08 | `feature/ask` |
| 09 | `feature/hardening` |
| 10 | `docs/ship-readme-demo` |

## Commits

- **Conventional Commits:** `feat:` `fix:` `docs:` `test:` `refactor:` `chore:` with a scope — `feat(find): rank segments with ts_rank_cd`.
- Each commit builds and type-checks. Small and focused; no `update`, `wip`, `final`, `changes`.
- **Authorship:** every commit is authored by the team member's own git identity. **No AI attribution of any kind** — no `Co-Authored-By: Claude …` trailer, no "Generated with Claude Code" line, no AI mention in commit messages.
- **No commit or push happens without the team lead's explicit go-ahead** during the hackathon build.

## Pull Requests

- One PR per feature branch, into `main`. Title in Conventional Commit form.
- Body uses `.github/pull_request_template.md`: which phase doc it implements, what changed, checklist.
- **No AI attribution in PR titles, bodies or comments** — no "🤖 Generated with Claude Code" footer.
- Merge only when: CI (lint, typecheck, unit tests) is green and the Vercel preview deploy works for the changed flow.
- **Merge commit** (`gh pr merge --merge`) — keeps each feature's commits and a "Merge pull request #n" commit on `main`, and keeps follow-up branches mergeable without rewriting history. Delete the branch after merge.
- One feature in flight at a time: branch from a fresh `main`, PR, CI green, merge, then start the next. No stacked PRs.
- **A PR is opened only when the branch has at least 20 changed files.** Smaller work keeps accumulating on the branch, so related phases ship together. Branch names describe the feature (`feature/gemini-answer-reels`), never a phase number.

## Keeping `main` Healthy

- Never commit directly to `main`; never force-push `main`.
- After every merge, local `main` is fast-forwarded (`git pull --ff-only`) before anything else.
- If a branch falls behind `main`: `git fetch origin && git rebase origin/main` on the feature branch, then `git push --force-with-lease` (feature branches only).
- Never commit secrets — check `git diff --cached` before every commit (`SECURITY.md`).

## Repo Setup Notes

**Oct 2 — repository moved.** HackIndia's auto-provisioned team repo could only be written by one member (the other's GitHub profile didn't match), and HackIndia's rules allow submitting your own public repo. The project, with its full history and every author's commits, now lives at `Monolithic-Dev/Pravaha`, where all members have write access. The sections below describe the original setup and remain accurate as history.

The local repository was initialised on Oct 1 and based on `origin/main`'s initial commit (`daf3d9d`), so all history is linear on top of what HackIndia created. The remote README's team tag line (`[hackindia-team:pixels-to-products-cloudinary-ai-hackathon-2026:code-blooded]`) is kept in `README.md` — HackIndia uses it to identify the team repo.
