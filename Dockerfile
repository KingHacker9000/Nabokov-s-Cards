# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container
COPY ./app /app

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Make the start.sh script executable
RUN chmod +x /app/start.sh

# Run the web app
CMD ["/app/start.sh"]
