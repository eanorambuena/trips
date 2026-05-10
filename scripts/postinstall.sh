#!/bin/bash
set -e

echo "🔧 Setting up Agentic Headquarter..."

# Install bun if not present
if ! command -v bun &> /dev/null; then
    echo "📦 Installing bun..."
    curl -fsSL https://bun.sh/install | bash
fi

# Install opencode-ai globally
echo "📦 Installing opencode-ai..."
npm install -g opencode-ai

# Configure OpenCode with minimax m2.5 free
echo "⚙️ Configuring OpenCode with minimax-m2.5-free..."
mkdir -p ~/.config/opencode

CONFIG_FILE="$HOME/.config/opencode/opencode.json"

# Create or update config with minimax model
cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/minimax-m2.5-free"
}
EOF

echo "✅ Setup complete! OpenCode configured with minimax-m2.5-free."
echo "   Starting OpenCode..."

# Start OpenCode
opencode