#!/bin/bash

if [ "$(uname)" == "Darwin" ]; then
  export TESTCONTAINERS_RYUK_DISABLED=true
fi

NODE_OPTIONS=--experimental-vm-modules yarn jest --coverageThreshold='{}' test/integration/
