from flask import Flask, render_template, request, session, send_file, redirect, jsonify, Response, send_from_directory
import json
from flask_session import Session
from tempfile import mkdtemp
import os
import openai
from dotenv import load_dotenv
from GPT_wrapper import get_response, generate_words

from DBHelper import LoggerDB

load_dotenv(override=True)

# Create Flask Application
app = Flask(__name__)

# Use the PORT environment variable, or default to port 5000
port = int(os.getenv("PORT", 5000))

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Database
DB = LoggerDB()

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

    reply = get_response("You are a Creative Writer.", f"Reply to the following conversation: {text}", "gpt-4o-mini")

    if request.method == "POST":
        return render_template("chat.html", text=reply)
    return reply

@app.route("/board")
def board():
    if request.args.get("uid"):
        session['session_id'] = DB.new_session(request.args["uid"])
        session['user_id'] = request.args["uid"]
        favourite_list = DB.get_favourites(request.args["uid"])
        return render_template("board.html", log=True, favourites=json.dumps(favourite_list))
    return render_template("board.html", favourites=json.dumps([]))

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

@app.route("/board/update", methods=['POST'])
def update_log():
    events = request.get_json()
    for event in events:
        DB.log_interaction(event, session['user_id'], session['session_id'])
    
    return jsonify({"Code": "200"})

# @app.route('/loaderio-83a1a4d80c8eb84f33231f300b44e350.txt')
# def serve_verification_file():
#     content = "loaderio-83a1a4d80c8eb84f33231f300b44e350"
#     return Response(content, mimetype='text/plain')

@app.route('/download/database')
def download_file():
    # Send the file from the same directory as app.py
    return send_from_directory(directory='.', path='UserInteractions.db', as_attachment=True)

@app.route('/database')
def database_execute():
    return DB.DB.execute(request.args.get("command", "SELECT * FROM Users;"))[0]

if __name__ == '__main__':
    
    app.run(host='0.0.0.0', port=port)