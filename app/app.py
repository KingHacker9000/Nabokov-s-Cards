from flask import Flask, render_template, request, session, send_file, redirect, jsonify, Response, send_from_directory
import json
from flask_session import Session
from tempfile import mkdtemp
import os
import openai
from dotenv import load_dotenv
from GPT_wrapper import get_response, generate_words

import re, random
from wordfreq import top_n_list

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
        favourite_list = DB.get_favourites(request.args["uid"], session["session_id"])
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
    type1 = get_type(s1)
    type2 = get_type(s2)

    user_content = f"""The {type1} is '{s1}' and {type2} is '{s2}'"""

    remove_punctuation = False

    if session.get("user_id"):
        fav_list = DB.get_favourites(session['user_id'],session['session_id'])
        fav_list = '", "'.join(fav_list)
    else:
        fav_list = ""
    # paragraph cases
    if 'paragraph' in [type1,type2]:
        if 'word' in [type1,type2]: # word+paragraph=sentence
            system_content = f"""
                                The goal is to mix the word together with the paragraph into a short paragraph in a narrative.
                                Keep the sentence short and less verbose. 
                                Try to make the sentence suprising and interesting. 
                                Remove subordinate clauses and parenthetical clauses. 

                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
        elif 'phrase' in [type1,type2]: # phrase+paragraph=sentence
            system_content = f"""
                                The goal is to mix and combine the following phrase and paragraph together into a short paragraph in a narrative.
                                Keep the sentence short and less verbose. 
                                Try to make the sentence suprising and interesting. 
                                Remove subordinate clauses and parenthetical clauses. 
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
        elif 'sentence' in [type1,type2]: # sentence+paragraph=sentence
            system_content = f"""
                                The goal is to mix the following the sentence and paragraph together into a short paragraph in a narrative.
                                Keep the paragraph concise and less verbose. 
                                Try to make the sentences suprising and interesting. 
                                Remove subordinate clauses and parenthetical clauses. 
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
        elif type1 == type2 : # paragraph+paragraph=paragraph
            system_content = f"""
                                The goal is to mix the following paragraphs together into a short paragraph in a narrative.
                                Keep the paragraph concise and less verbose. 
                                Try to make the sentences suprising and interesting. 
                                Remove subordinate clauses and parenthetical clauses. 
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
    # sentence cases
    elif 'sentence' in [type1, type2]:
        if 'word' in [type1,type2]: # word+sentence=sentence
            system_content = f"""
                                The goal is to mix and combine the following word and sentence together into one or two coherent sentences in a narrative.
                                Keep the sentence short and less verbose. Try to make the sentence unexpected. 
                                Remove subordinate clauses and parenthetical clauses.
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
        elif 'phrase' in [type1,type2]: # phrase+sentence=sentence
            system_content = f"""
                                The goal is to mix and combine the following phrase and sentence together into one or two coherent sentences in a narrative.
                                Keep the sentence short and less verbose, keep the sentences under 30 words. Try to make the sentence suprising and interesting. 
                                Remove subordinate clauses and parenthetical clauses. 
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
        elif type1 == type2 : # sentence+sentence=paragraph
            system_content = f"""
                                The goal is to mix and combine the following sentences together into a short paragraph in a narrative.
                                Keep the paragraph short and less verbose. 
                                Try to make the sentences suprising and interesting. 
                                Remove subordinate clauses and parenthetical clauses. 
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
    # phrase case
    elif 'phrase' in [type1, type2]:
        if 'word' in [type1,type2]: # word+phrase=sentence
            system_content = f"""
                                The goal is to combine the following word and phrase together into a single coherent sentence in a narrative.
                                Keep the sentence short and less verbose. Try to make the sentence unexpected. 
                                Remove subordinate clauses and parenthetical clauses.
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
        elif type1 == type2 : # phrase+phrase=sentence
            system_content = f"""
                                The goal is to combine the following phrases together into one or two coherent sentences in a narrative.
                                Keep the sentence short and less verbose. Try to make the sentence suprising and interesting. 
                                Remove subordinate clauses and parenthetical clauses. 
                                
                                Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
                            """
    # word case
    elif type1 == 'word' and type2 == 'word': # word+word=phrase
        system_content = f"""
        The goal is to combine the following words together into a coherent phrase with a maximum of 7 words. 
        Other example senteces that appear in this narrative could be similar to but not include the same words are "{fav_list}"
        """
        remove_punctuation = True
    else:
        return jsonify({"s": "Error: Unable to Mix 2 Paragraphs", "type": "sentence"}), 200

    # get GPT response
    r = get_response(system_content, user_content)
    if remove_punctuation:
        r = re.sub(r'[.,?!"]','',r)
    
    print()
    
    # Return the
    return jsonify({"s": r, "type": "sentence", "Prompt": [system_content, user_content]}), 200
    

@app.route("/board/notes")
def words():
    n: str = request.args.get('n')
    return generate_words(n)

@app.route("/board/update", methods=['POST'])
def update_log():
    events = request.get_json()
    for event in events:
        if session.get('user_id'):
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

##### Helper functions #####
def get_type(input_string):
    # Determine whether string is of type blank, word, phrase, sentence, or paragraph
    stripped_string = input_string.strip()
    if not stripped_string:
        return "blank"

    # Split the string into sentences based on common sentence-ending punctuation
    sentences = re.split(r'[.!?;]\s*', stripped_string)
    sentences = [s for s in sentences if s]  # Remove empty strings

    if len(sentences) == 0:
        return "word"
    elif len(sentences) == 1:
        # Split the single sentence into words to differentiate between word and phrase
        words = stripped_string.split()
        if len(words) == 1:
            return "word"
        elif re.search(r'[.!?;]$', stripped_string):
            return "sentence"
        else:
            return "phrase"
    else:
        return "paragraph"


def get_random_word():

    #TODO: Call for regenerate if the word is blank
    top_words = top_n_list("en", 10000)
    top_words = [s for s in top_words if len(s) > 1] #Filter out single letter words
    return random.choice(top_words)  # Pick a random word

if __name__ == '__main__':
    
    app.run(host='0.0.0.0', port=port)