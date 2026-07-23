#!/bin/bash

# Exit on error
set -e

# Clone Flutter stable if not already present
if [ ! -d "flutter" ]; then
  echo "Downloading Flutter..."
  git clone https://github.com/flutter/flutter.git -b stable --depth 1
fi

# Add Flutter to PATH
export PATH="$PATH:`pwd`/flutter/bin"

# Pre-download artifacts
flutter config --no-analytics
flutter doctor -v

# Install dependencies and build web
flutter pub get
flutter build web --release
