from simpleDB import Database
from datetime import datetime
import random

# Connect to or create the database
db = Database('UserInteractions.db')

# Step 1: Create tables for User Information, Logged Data, and Elements

# User Table
db.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY,
        user_name TEXT
    );
""")

# Logged Data Table
db.execute("""
    CREATE TABLE IF NOT EXISTS Interactions (
        interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp DATETIME DEFAULT (DATETIME('now', 'localtime')),
        event TEXT,
        session_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES Users(user_id),
        FOREIGN KEY(session_id) REFERENCES Sessions(session_id)
    );
""")

# Cards Table for Cards associated with each event
db.execute("""
    CREATE TABLE IF NOT EXISTS Cards (
        card_id INTEGER PRIMARY KEY AUTOINCREMENT,
        interaction_id INTEGER,
        original_text TEXT,
        final_text TEXT,
        FOREIGN KEY(interaction_id) REFERENCES Interactions(interaction_id)
    );
""")

# Words Table
db.execute("""
    CREATE TABLE IF NOT EXISTS Words (
        word_id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT,
        card_id INTEGER,
        FOREIGN KEY(card_id) REFERENCES Cards(card_id)
    );
""")

# Sessions Table
db.execute("""
    CREATE TABLE IF NOT EXISTS Sessions (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES Users(user_id)
    );
""")

# Favourites Table
db.execute("""
    CREATE TABLE Favourites (
    favourite_id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    interaction_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES Users(user_id),
    FOREIGN KEY(interaction_id) REFERENCES Interactions(interaction_id)
);
""")

# Unfavourites Table
db.execute("""
    CREATE TABLE Unfavourites (
    unfavourite_id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    interaction_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES Users(user_id),
    FOREIGN KEY(interaction_id) REFERENCES Interactions(interaction_id)
);
""")

# Step 2: Insert Functions for Logging Data

def add_user(user_name):
    """Adds a new user to the database."""
    user_result, status = db.execute("INSERT INTO Users (user_name) VALUES (?) RETURNING user_id;", (user_name,))
    print(f"User {user_result[0]['user_id']} added.")

add_user('Ash')     # User_id = 1
add_user('Dashiel') # User_id = 2
add_user('Nicole')  # User_id = 3
add_user('Abhishek')# User_id = 4
add_user('Bogdan')  # User_id = 5
add_user('Jeb')     # User_id = 6
add_user('Matthew') # User_id = 7
add_user('Patrick') # User_id = 8
add_user('Warren')  # User_id = 9


if __name__ == "__main__":
    # Add a sample user
    
    import json

    s = json.dumps(db.execute("SELECT * FROM Users;")[0], indent=2)

    print(s)

    # Define example events
    #events = ['ADD', 'DELETE', 'DECOUPLE', 'COMBINE', 'EDIT', 'COPY', 'PASTE', 'STASH', 'UNDO', 'REDO']

