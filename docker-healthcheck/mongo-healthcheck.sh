#!/bin/sh
# Saída de sucesso se o MongoDB estiver respondendo
if mongo --eval "db.adminCommand('ping').ok" > /dev/null; then
    exit 0
else
    exit 1
fi
