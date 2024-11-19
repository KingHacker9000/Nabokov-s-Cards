#!/bin/bash
# Start the Gunicorn server with the PORT environment variable
if python DatabaseSetup.py; then
  echo "Database setup completed successfully."
else
  echo "Database setup failed. Exiting."
  exit 1
fi
gunicorn -b 0.0.0.0:${PORT:-5000} app:app
