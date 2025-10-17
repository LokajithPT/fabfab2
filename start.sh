#!/bin/bash

# Exit on any error
set -e

# Initialize the database
echo "Initializing database..."
flask --app server/app init-db

# Start the Gunicorn server
echo "Starting Gunicorn..."
gunicorn server.app:app
