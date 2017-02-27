#!/bin/bash

SCRIPT=$(basename $0)

function doLog() {
echo $(date "+%Y%m%d %H:%M:%S.%N")" $SCRIPT:$1"
}
