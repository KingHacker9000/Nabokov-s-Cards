# Set Up

### Dependencies

```pip install -r app/requirements.txt```

### OpenAI API Key

Replace `[YOUR_OPENAI_API_KEY]` with the secret key.

#### Windows

```echo OPENAI_API_KEY=[YOUR_OPENAI_API_KEY] > app/.env```

### macOS

```echo "OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]" > app/.env```

### Else

Create a file named .env under the app directory and put in the following text:
```OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]```

# Running Server Locally

```python app/app.py```

# Viewing Prompts on the Console

Type ```DEBUG = true;``` on the console.

# Editing The Prompt

In `app/app.py` find the combine function. Edit the Prompts for each of the various types of combinations.

`get_response` function's working can be viewed in the `app/GPT_Wrapper.py` file

`get_response` Takes in 2 Positional Parameters:
- `system_content`: Gives context on what the LLM is supposed to produce
- `user_content`: Provides the actual user input
- `model` (Optional Parameter): Provide the name of the model you want to use. (See List below)

# Editing Default GPT Model:

You can change the Default GPT model in `app/GPT_Wrapper.py` and change `"gpt-3.5-turbo"` to one in the following list or from [OpenAI website](https://platform.openai.com/docs/models):

 - chatgpt-4o-latest
 - gpt-4o
 - gpt-4o-mini
 - gpt-4-turbo
 - gpt-4
 - gpt-3.5-turbo