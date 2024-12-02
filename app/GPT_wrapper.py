import openai

# "chatgpt-4o-latest"
def get_response(system_content, user_content, model="gpt-4o") -> str:
    completion = openai.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": system_content
            },
            {
                "role": "user",
                "content": user_content
            }
        ],
        temperature=1,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )

    return completion.choices[0].message.content



def generate_words(n):
    completion = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a creative assistant that helps gives creative and imaginative words. No other text is required."
            },
            {
                "role": "user",
                "content": f"Give me only {n} words, no punctuations, no repetitions, each split only by a space. Only nouns."
            }
        ],
        temperature=1,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )

    return completion.choices[0].message.content