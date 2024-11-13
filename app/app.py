from flask import Flask, render_template, request, session, send_file, redirect, jsonify, Response
import os
import openai
from dotenv import load_dotenv
from GPT_wrapper import get_response, generate_words

load_dotenv(override=True)

# Create Flask Application
app = Flask(__name__)

# Use the PORT environment variable, or default to port 5000
port = int(os.getenv("PORT", 5000))

openai.api_key = os.environ['OPENAI_API_KEY']

# Home Directory
@app.route('/')
def home():
    return render_template("sidebar.html", timer=True)
 
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

@app.route("/board/pilot")
def pilot_board():
    return render_template("board.html", timer=True)

@app.route("/board/combine", methods=["POST"])
def combine():
    data = request.get_json()

    s1: str = data.get("s1")
    s2: str = data.get("s2")
    type1: str = data.get("type1")
    type2: str = data.get("type2")

    # Combine 2 words into a sentence
    if type1 == "word" == type2:
        system_content = "Your Goal is to Combine 2 words in a cohesive sentence that incorporates the 2 words or their essence."
        user_content = f"Combine the following words into a single cohesive sentence: '{s1}' and '{s2}':"
        r = get_response(system_content, user_content)
    
        # Return the
        return jsonify({"s": r, "type": "sentence", "Prompt": [system_content, user_content]}), 200
    
    # 2 sentences
    if type1 == "sentence" == type2:
        system_content = "Your Goal is to Combine 2 sentences into a cohesive narrative that incorporates the 2 sentences or their essence."
        user_content = f"Combine the following sentences into a cohesive narrative paragraph: '{s1}' and '{s2}':"
        r = get_response(system_content, user_content)
    
        return jsonify({"s": r, "type": "paragraph", "Prompt": [system_content, user_content]}), 200
    
    # 1 word 1 sentence
    elif "word" in [type1, type2] and "sentence" in [type1, type2]:
        system_content = "Your Goal is to Combine a word and a sentence into a cohesive narrative that incorporates them or their essence."
        user_content = f"Combine the following word with the following sentence into a narrative paragraph: '{s1}' and '{s2}':"
        r = get_response(system_content, user_content)
    
        return jsonify({"s": r, "type": "paragraph", "Prompt": [system_content, user_content]}), 200

    # 1 word 1 paragraph
    elif "word" in [type1, type2] and "paragraph" in [type1, type2]:
        system_content = "Your Goal is to Combine a word and a paragraph into a cohesive narrative that incorporates them or their essence."
        user_content =  f"Combine the following word with the following paragraph into a narrative paragraph: '{s1}' and '{s2}':"
        r = get_response(system_content, user_content)
    
        return jsonify({"s": r, "type": "paragraph", "Prompt": [system_content, user_content]}), 200
    
    # 1 sentence 1 paragraph
    elif "sentence" in [type1, type2] and "paragraph" in [type1, type2]:
        system_content = "Your Goal is to Combine a sentence and a paragraph into a cohesive narrative that incorporates them or their essence."
        user_content = f"Combine the following sentence with the following paragraph into a narrative paragraph: '{s1}' and '{s2}':"
        r = get_response(system_content, user_content)
    
        return jsonify({"s": r, "type": "paragraph", "Prompt": [system_content, user_content]}), 200
    
    return jsonify({"s": "Error: Unable to Mix 2 Paragraphs", "type": "sentence"}), 200


@app.route("/board/notes")
def words():
    n: str = request.args.get('n')
    return generate_words(n)

@app.route('/loaderio-83a1a4d80c8eb84f33231f300b44e350.txt')
def serve_verification_file():
    content = "loaderio-83a1a4d80c8eb84f33231f300b44e350"
    return Response(content, mimetype='text/plain')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)