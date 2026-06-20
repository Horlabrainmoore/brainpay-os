# Pull Request Body Template

Title: security: remove exposed credentials and add remediation docs

Summary:
This PR removes exposed credential files from the working tree, adds a .gitignore entry to prevent re-adding such files, and includes remediation documentation with instructions for purging history and rotating keys.

Files changed:
- .gitignore
- SECURITY_REMOVAL.md
- scripts/purge_secrets_instructions.sh
- placeholders for removed secrets

Post-merge checklist:
- Run git-filter-repo locally to purge history as described in SECURITY_REMOVAL.md
- Revoke and rotate all exposed keys
- Re-clone the repository for all team members
- Add secrets to a secrets manager and update CI to use them
