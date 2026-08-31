# Research Vault deployment

The Jira Viewer reads a read-only snapshot of `Colab-Claro/research-obsidian` from `/home/azureuser/research-obsidian-current`. A systemd timer checks `origin/main` every five minutes and switches the symlink only after validating the complete candidate snapshot.

Only committed and pushed Markdown reaches the VM. Local Obsidian workspace changes are not synchronized.

## Paths

- updater: `/usr/local/bin/research-vault-deploy`
- deployment root: `/home/azureuser/research-obsidian-deploy`
- bare Git repository: `/home/azureuser/research-obsidian-deploy/repository.git`
- immutable releases: `/home/azureuser/research-obsidian-deploy/releases/<sha>`
- active snapshot: `/home/azureuser/research-obsidian-current`
- credential: `/home/azureuser/.config/research-obsidian/git-credentials`
- timer: `research-vault-deploy.timer`

## Install

Install the reviewed artifacts, reload systemd and start the timer:

```bash
sudo install -o root -g root -m 0755 ops/research-vault-deploy.sh /usr/local/bin/research-vault-deploy
sudo install -o root -g root -m 0644 ops/systemd/research-vault-deploy.service /etc/systemd/system/research-vault-deploy.service
sudo install -o root -g root -m 0644 ops/systemd/research-vault-deploy.timer /etc/systemd/system/research-vault-deploy.timer
sudo systemd-analyze verify /etc/systemd/system/research-vault-deploy.service /etc/systemd/system/research-vault-deploy.timer
sudo systemctl daemon-reload
sudo systemctl enable --now research-vault-deploy.timer
sudo systemctl start research-vault-deploy.service
```

The credential file must be owned by `azureuser`, have mode `0600`, and contain a Git credential for `github.com`. Never put the token in a remote URL, unit, script argument or journal message.

## Operations

Run an immediate update:

```bash
sudo systemctl start research-vault-deploy.service
```

Check the active revision and the remote revision:

```bash
cat /home/azureuser/research-obsidian-current/.research-revision
git -C /home/azureuser/research-obsidian-deploy/repository.git rev-parse refs/remotes/origin/main
```

Inspect the timer and recent logs:

```bash
systemctl list-timers research-vault-deploy.timer
journalctl -u research-vault-deploy.service -n 100 --no-pager
```

## Rollback

List retained releases and atomically point `current` at the selected SHA:

```bash
find /home/azureuser/research-obsidian-deploy/releases -mindepth 1 -maxdepth 1 -type d -printf '%f\n'
ln -s /home/azureuser/research-obsidian-deploy/releases/<sha> /home/azureuser/research-obsidian-current.next
mv -Tf /home/azureuser/research-obsidian-current.next /home/azureuser/research-obsidian-current
```

The next timer execution will activate `origin/main` again unless the timer is stopped first.

## Credential rotation

Write the new credential without placing it in shell history, set owner `azureuser:azureuser` and mode `0600`, then run an immediate update. Confirm that both repository remotes remain clean HTTPS URLs afterward.
