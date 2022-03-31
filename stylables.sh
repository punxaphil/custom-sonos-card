#!/usr/bin/env bash
grep  "stylable('" -R src|sed "s/.*stylable('//g"|sed "s/'.*//g"|sort -u
