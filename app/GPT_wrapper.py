import openai

# "chatgpt-4o-latest"
def get_response(system_content, user_content, model="gpt-3.5-turbo") -> str:
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