#!/bin/bash
# TypeScript check script that properly uses project configuration

echo "Checking TypeScript compilation for notifications components..."

# Check individual components using tsc with project config
npx tsc --noEmit \
  --project . \
  --include "components/notifications/*.tsx" \
  --skipLibCheck \
  --maxNodeModuleJsDepth 1

echo "TypeScript check complete!"