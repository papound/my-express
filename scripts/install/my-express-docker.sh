#!/usr/bin/env bash
set -euo pipefail

echo "==> 1. Updating packages & installing prerequisites..."
apt-get update -y
apt-get install -y curl git ca-certificates gnupg cifs-utils htop

echo "==> 2. Installing Docker Engine..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> 3. Configuring insecure registry 192.168.1.117:5000..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'DAEMON_EOF'
{
  "insecure-registries": ["192.168.1.117:5000"]
}
DAEMON_EOF

systemctl enable --now docker
systemctl restart docker

echo "==> 4. Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

echo "==> 5. Creating directory structure..."
mkdir -p /opt/my-express
mkdir -p /mnt/express/ThongTha

echo "==> 6. Verifying Docker:"
docker --version
docker compose version

echo "==> Setup completed successfully!"

