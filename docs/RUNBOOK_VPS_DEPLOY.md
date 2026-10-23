# VPS deployment (api.repsi.app)

Server layout: repo in `/opt/repsi-core`, secrets in `/etc/repsi/production.env`, deploy user `repsi`.
After this setup, every push to `master` that changes the API deploys itself once CI passes.

## 0. Do these first (security)

1. **Change the server password and stop using password login.** The password was shared in chat, so treat
   it as exposed. On the server: `passwd`. Then use SSH keys only (step 2) and set
   `PasswordAuthentication no` in `/etc/ssh/sshd_config.d/10-repsi.conf`, followed by `sudo systemctl reload ssh`.
2. **Rotate demo accounts in the production database.** The old routine ran `app.core.seed` on every deploy.
   That script created demo accounts with passwords that are in git history (a super admin among them) and
   reset one account's password each time. It now refuses to run in production, and the deploy no longer calls it.
   List the demo accounts in the production database (`admin@repsi.app`, `nitheesh@repsi.app`, `owner@repsi.app`,
   `trainer@repsi.app`, `user@repsi.app`, `owner@apexfitness.in`) and for each one you keep, set a new password:

   ```bash
   sudo docker compose -f docker-compose.production.yml exec -it api \
     uv run --no-sync python -m scripts.set_password you@example.com
   ```

   For the ones you don't need, deactivate them in the super admin panel. Rotate the account you use as super admin first.

## 1. One-time server setup

```bash
# deploy key for GitHub Actions (on your own machine):
ssh-keygen -t ed25519 -f ~/.ssh/repsi_deploy -C "github-actions-deploy" -N ""
ssh-copy-id -i ~/.ssh/repsi_deploy.pub repsi@129.121.134.7      # asks for the server password once

# on the server, as repsi:
sudo install -d -m 750 -o root -g repsi /etc/repsi
echo 'repsi ALL=(root) NOPASSWD: /usr/bin/docker' | sudo tee /etc/sudoers.d/repsi-docker && sudo chmod 440 /etc/sudoers.d/repsi-docker
sudo apt-get install -y python3 curl util-linux            # deploy script needs python3, curl, flock
cd /opt/repsi-core && git status                           # must be clean
```

If a hand-made `docker-compose.production.yml` sits in `/opt/repsi-core` as an untracked file, move it away first
(`mv docker-compose.production.yml ~/compose.old.yml`) or `git pull` will refuse, because the repo now ships its own.
Compare the two before deleting the old one; port, volumes and any reverse-proxy network must carry over.

## 2. Check the production env file

```bash
sudo python3 /opt/repsi-core/app/api/scripts/check_production_env.py /etc/repsi/production.env
```

It prints problems without printing values. Fix every `ERROR`. It requires, among others:
`ENVIRONMENT=production`, a random `SECRET_KEY` (32+ characters), PostgreSQL `DATABASE_URL` with `sslmode=require`,
`OTP_PROVIDER=aisensy` with its key and campaign, and no test OTP. Set `GOOGLE_CLIENT_ID`, SMTP and
`BACKEND_CORS_ORIGINS=["https://repsi.app","https://www.repsi.app"]` too. The file should be `chmod 640`, owner `root:repsi`.

## 3. First deploy by hand

```bash
cd /opt/repsi-core && git pull --ff-only origin master && bash deploy/deploy.sh
```

This replaces your old five-line routine: it checks the env file, takes a database backup, builds, starts,
waits for `/health` (up to 3 minutes), and rolls back to the previous commit when the new one is unhealthy.

## 4. Automatic deploys from GitHub

In the GitHub repository: **Settings → Environments → New environment → `production`** (add yourself as a required
reviewer if you want an approval step), then add these secrets to it:

| Secret | Value |
|---|---|
| `VPS_HOST` | `129.121.134.7` |
| `VPS_USERNAME` | `repsi` |
| `VPS_SSH_KEY` | contents of `~/.ssh/repsi_deploy` (the private key) |
| `VPS_PORT` | only if SSH isn't on port 22 |

Then pushing to `master` runs CI (API tests, web lint/type check/build, Playwright). If CI passes and the push
touched `app/api/`, `deploy/` or the compose file, the workflow deploys. Run it manually from the Actions tab
(**Deploy API → Run workflow**) to redeploy or roll back to any commit.

## 5. Day-to-day

| Task | Command |
|---|---|
| Status | `sudo docker compose -f docker-compose.production.yml ps` |
| Logs | `sudo docker compose -f docker-compose.production.yml logs -f --tail 100 api` |
| Roll back | Actions → Deploy API → Run workflow → ref = previous commit SHA |
| Backup now | `sudo docker compose -f docker-compose.production.yml run --rm --no-deps api uv run --no-sync python -m scripts.backup --label manual` |
| Job runs | super admin → System health, or `GET /api/v1/superadmin/jobs` |

Backups, restore and the job list are in `RUNBOOK_OPERATIONS.md`.
