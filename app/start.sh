#!/bin/bash
# Start the Gunicorn server with the PORT environment variable
gunicorn -b 0.0.0.0:${PORT:-5000} app:app
