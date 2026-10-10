#!/usr/bin/env bash
# Installe tout ce qu'il faut pour produire une édition (environ 2 minutes).
set -e
cd "$(dirname "$0")/.."
pip install --break-system-packages -q edge-tts num2words pillow brotli cairosvg 2>&1 | grep -v WARNING || true
# Le proxy de l'environnement utilise sa propre autorité de certification : on l'ajoute pour edge-tts.
if [ -f /root/.ccr/ca-bundle.crt ]; then
  CERT=$(python3 -c "import certifi; print(certifi.where())")
  grep -q "ccr-agent-proxy-marker" "$CERT" 2>/dev/null || { echo "# ccr-agent-proxy-marker" >> "$CERT"; cat /root/.ccr/ca-bundle.crt >> "$CERT"; }
fi
npm ci --no-audit --no-fund --loglevel=error
echo "Installation terminée."
