#!/bin/bash
# purge_secrets_instructions.sh
# WARNING: This script only prints recommended commands. Do NOT run this in CI directly without understanding.

set -euo pipefail

echo "1) Clone a mirror of the repo (run from a secure machine):"
echo "   git clone --mirror git@github.com:Horlabrainmoore/brainpay-os.git"
echo "   cd brainpay-os.git"

echo "2) Run git-filter-repo to remove paths (install first: https://github.com/newren/git-filter-repo):"
echo "   git filter-repo --invert-paths --path brainpay-ai-app-firebase-adminsdk-fbsvc-611a35ba2b.json --path google-services.json --path \"Horla Brain\""

echo "3) Force-push cleaned repo back to origin (be cautious):"
echo "   git push --force --all origin"
echo "   git push --force --tags origin"

echo "4) Rotate credentials in GCP/Firebase and create new secrets in Secret Manager / GitHub Secrets"
