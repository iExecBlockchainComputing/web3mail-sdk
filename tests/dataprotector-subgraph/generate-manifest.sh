#!/bin/bash

# Check if START_BLOCK is not empty and if its a positive integer
if [[ -z "$START_BLOCK" || ! "$START_BLOCK" =~ ^[0-9]+$ ]]
then
    # default start block
    echo "using default startBlock"
    START_BLOCK="21776029"
fi

echo "set startBlock: $START_BLOCK"

sed "s|#START_BLOCK_PLACEHOLDER#|startBlock: $START_BLOCK|g" subgraph.template.yaml > subgraph.yaml
