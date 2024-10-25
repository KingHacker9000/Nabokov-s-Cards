# Set Up

### Dependencies

`pip install -r app/requirements.txt`

### OpenAI API Key

Replace `[YOUR_OPENAI_API_KEY]` with the secret key.

#### Windows

`echo OPENAI_API_KEY=[YOUR_OPENAI_API_KEY] > app/.env`

### macOS

`echo "OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]" > app/.env`

### Else

Create a file named .env under the app directory and put in the following text:
`OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]`

# Running Server Locally

`python app/app.py`

# Editing The Prompt