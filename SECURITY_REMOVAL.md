# SECURITY REMOVAL & REMEDIATION

This commit remediates accidental secret exposure on branch feat/core/add-btcpay-transaction-broker.

Removed / Overwritten files (history still contains the originals - see purge instructions):
- brainpay-ai-app-firebase-adminsdk-fbsvc-611a35ba2b.json
- google-services.json
- Horla Brain (wallet/keystore backup)

Immediate actions you MUST take now (one-by-one):
1) Revoke exposed credentials
   - GCP service account key:
     gcloud iam service-accounts keys list --iam-account="firebase-adminsdk-fbsvc@brainpay-ai-app.iam.gserviceaccount.com"
     gcloud iam service-accounts keys delete <KEY_ID> --iam-account="firebase-adminsdk-fbsvc@brainpay-ai-app.iam.gserviceaccount.com"
   - Firebase / API keys:
     Remove the API key shown in google-services.json from the Firebase Console -> Project Settings -> Web API Keys (delete and create a new restricted key).
   - Wallet / keystore: treat as compromised. Create a new wallet and transfer any funds immediately.

2) Purge secrets from git history (local recommended)
   - Install git-filter-repo: https://github.com/newren/git-filter-repo
   - Run (from a machine that has your repo mirrored/cloned):

       git clone --mirror git@github.com:Horlabrainmoore/brainpay-os.git
       cd brainpay-os.git
       git filter-repo --invert-paths --path brainpay-ai-app-firebase-adminsdk-fbsvc-611a35ba2b.json --path google-services.json --path "Horla Brain"
       git push --force --all origin
       git push --force --tags origin

   - Alternative: BFG Repo-Cleaner (follow BFG docs)

3) Rotate all credentials again after purge (tokens may have been cached elsewhere).

4) Add secret management and protections
   - Move credentials to GCP Secret Manager or GitHub Secrets
   - Enforce branch protection rules and required checks before merging to main
   - Enable GitHub Advanced Security / secret scanning
   - Add CI validation to block secrets in commits (pre-commit hooks like detect-secrets or GitHub Actions workflows)

Notes
- This commit overwrites the exposed files with placeholders to prevent re-exposure in future commits on this branch; it does NOT remove the files from repository history. Use filter-repo (steps above) to scrub history.
- After you purge history, instruct all collaborators to re-clone the repository (old clones will still contain the secrets).

Contact
If you'd like, I can draft the PR body for the security remediation PR, create CI workflows to scan for secrets, or help produce the BTCPay + Transaction Broker scaffolding after the purge is complete.
