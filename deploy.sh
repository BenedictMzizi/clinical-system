#!/bin/bash

echo "Building system..."

docker-compose build

echo "Starting services..."

docker-compose up -d

echo "Deployment complete"

docker ps
