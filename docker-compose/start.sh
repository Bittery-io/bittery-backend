#!/bin/bash
docker-compose -f docker-compose.yaml down --volumes
docker-compose -f docker-compose.yaml up
