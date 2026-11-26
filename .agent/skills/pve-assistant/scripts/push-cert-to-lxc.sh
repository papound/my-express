#!/bin/bash
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

CTID=108
SRC="/root/.acme.sh/papoundhomelab.ddnsgeek.com_ecc"

# หาโฟลเดอร์ล่าสุดใน /data/custom_ssl
LATEST_DIR=$(pct exec $CTID -- bash -c "ls -1t /data/custom_ssl | head -n 1")
DST="/data/custom_ssl/$LATEST_DIR"

echo "Using latest directory: $DST"

# push cert
pct exec $CTID -- mkdir -p "$DST"
pct push $CTID "$SRC/fullchain.cer" "$DST/fullchain.pem"
pct push $CTID "$SRC/papoundhomelab.ddnsgeek.com.key" "$DST/privkey.pem"

# sync NPM database
pct exec $CTID -- python3 /data/scripts/sync_cert.py || true

# reload services (Zero-downtime)
pct exec $CTID -- systemctl restart openresty || true
pct exec $CTID -- systemctl restart npm || true

echo "Certificate deployment & NPM sync completed successfully!"
