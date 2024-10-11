from flask import Flask, render_template, request, session, send_file, redirect, jsonify
import os
import openai
from dotenv import load_dotenv
from GPT_wrapper import get_response

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

    reply = get_response("You are a Creative Writer.", f"Reply to the following conversation: {text}", "gpt-3.5-turbo")

    if request.method == "POST":
        return render_template("chat.html", text=reply)
    return reply

@app.route("/board")
def board():
    return render_template("board.html")

@app.route("/board/combine", methods=["POST"])
def combine():
    data = request.get_json()

    s1: str = data.get("s1")
    s2: str = data.get("s2")
    type1: str = data.get("type1")
    type2: str = data.get("type2")

    # 2 words
    if type1 == "word" == type2:
        r = get_response("Your Goal is to Combine 2 words in a cohesive scentence that incorporates the 2 words or their essence.", 
                            f"Combine the following words into a single cohesive sentence: '{s1}' and '{s2}':")
    
        return jsonify({"s": r, "type": "scentence"}), 200
    
    # 2 scentences
    if type1 == "scentence" == type2:
        r = get_response("Your Goal is to Combine 2 scentences into a cohesive narrative that incorporates the 2 scentences or their essence.", 
                            f"Combine the following sentences into a cohesive narrative paragraph: '{s1}' and '{s2}':")
    
        return jsonify({"s": r, "type": "paragraph"}), 200
    
    # 1 word 1 scentence
    elif "word" in [type1, type2] and "scentence" in [type1, type2]:
        r = get_response("Your Goal is to Combine a word and a scentence into a cohesive narrative that incorporates them or their essence.", 
                            f"Combine the following word with the following sentence into a narrative paragraph: '{s1}' and '{s2}':")
    
        return jsonify({"s": r, "type": "paragraph"}), 200

    # 1 word 1 paragraph
    elif "word" in [type1, type2] and "paragraph" in [type1, type2]:
        r = get_response("Your Goal is to Combine a word and a paragraph into a cohesive narrative that incorporates them or their essence.", 
                            f"Combine the following word with the following paragraph into a narrative paragraph: '{s1}' and '{s2}':")
    
        return jsonify({"s": r, "type": "paragraph"}), 200
    
    # 1 scentence 1 paragraph
    elif "scentence" in [type1, type2] and "paragraph" in [type1, type2]:
        r = get_response("Your Goal is to Combine a scentence and a paragraph into a cohesive narrative that incorporates them or their essence.", 
                            f"Combine the following scentence with the following paragraph into a narrative paragraph: '{s1}' and '{s2}':")
    
        return jsonify({"s": r, "type": "paragraph"}), 200
    
    return jsonify({"s": "Error", "type": "word"}), 200


@app.route("/board/notes")
def words():
    n: str = request.args.get('n')

    completion = openai.chat.completions.create(
        model="chatgpt-4o-latest",
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)