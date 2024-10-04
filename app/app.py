from flask import Flask, render_template, request, session, send_file, redirect, jsonify
import openai
import os
from dotenv import load_dotenv

load_dotenv(override=True)

# Create Flask Application
app = Flask(__name__)

# Use the PORT environment variable, or default to port 5000
port = int(os.getenv("PORT", 5000))

openai.api_key = os.environ['OPENAI_API_KEY']

# Home Directory
@app.route('/')
def home():
    return render_template("index.html")
 
@app.route('/chat', methods=["GET", 'POST'])
def chat():
    
    # POST Method
    if request.method == "POST":
        text = request.form.get("text")
    else:
        text = request.args.get("text")
        if text is None:
            return "Error"

    completion = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
        {
            "role": "assistant",
            "content": "Speak like a very creative writer, following is a conversation, continue it:" + text
        }
        ],
        temperature=1,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )

    reply = completion.choices[0].message.content
    print(reply)
    if request.method == "POST":
        return render_template("chat.html", text=reply)
    return reply

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)