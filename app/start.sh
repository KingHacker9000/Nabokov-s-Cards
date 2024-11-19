#!/bin/bash
# Start the Gunicorn server with the PORT environment variable
python DatabaseSetup.py
gunicorn -b 0.0.0.0:${PORT:-5000} app:app
