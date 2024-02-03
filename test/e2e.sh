#!/bin/bash

if [ "$(uname)" == "Darwin" ]; then
  export TESTCONTAINERS_RYUK_DISABLED=true
fi

NODE_OPTIONS=--experimental-vm-modules yarn jest --no-coverage test/e2e/
