import sqlitecloud
import json
import os
from dotenv import load_dotenv

load_dotenv(override=True)

# Connect to SQLite Cloud
conn = sqlitecloud.connect(os.environ['SQLite_Connection'] + 'apikey='+ os.environ['SQLite_apikey'])

# Database name
db_name = 'UserInteractions'

# Step 1: Create Tables
conn.execute(f"USE DATABASE {db_name}")

drop_table_queries = [
    "DROP TABLE IF EXISTS Users;",
    "DROP TABLE IF EXISTS Interactions;",
    "DROP TABLE IF EXISTS Cards;",
    "DROP TABLE IF EXISTS Words;",
    "DROP TABLE IF EXISTS Sessions;",
    "DROP TABLE IF EXISTS Favourites;",
    "DROP TABLE IF EXISTS Unfavourites;"
]

# Create tables
create_table_queries = [
    """
    CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY,
        user_name TEXT
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS Interactions (
        interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp DATETIME DEFAULT (DATETIME('now', 'localtime')),
        event TEXT,
        session_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES Users(user_id),
        FOREIGN KEY(session_id) REFERENCES Sessions(session_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS Cards (
        card_id INTEGER PRIMARY KEY AUTOINCREMENT,
        interaction_id INTEGER,
        original_text TEXT,
        final_text TEXT,
        FOREIGN KEY(interaction_id) REFERENCES Interactions(interaction_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS Words (
        word_id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT,
        card_id INTEGER,
        FOREIGN KEY(card_id) REFERENCES Cards(card_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS Sessions (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES Users(user_id)
    );
    """,
    """
    CREATE TABLE Favourites (
        favourite_id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        interaction_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES Users(user_id),
        FOREIGN KEY(interaction_id) REFERENCES Interactions(interaction_id)
    );
    """,
    """
    CREATE TABLE Unfavourites (
        unfavourite_id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        interaction_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES Users(user_id),
        FOREIGN KEY(interaction_id) REFERENCES Interactions(interaction_id)
    );
    """
]


# Step 2: Insert Functions for Logging Data
def add_user(conn, user_name):
    """Adds a new user to the database."""
    query = "INSERT INTO Users (user_name) VALUES (?) RETURNING user_id;"
    cursor = conn.execute(query, (user_name,))
    user_id = cursor.fetchone()[0]
    print(f"User {user_id} added.")
    print(f"Link: https://creative-c9e7df5a5b26.herokuapp.com/board?uid={user_id}")


if __name__ == "__main__":

    RESTART = False

    if RESTART and input('WARNING DROP? (Y/n): ').lower() == 'y':
        # Disable foreign key checks temporarily
        conn.execute("PRAGMA foreign_keys = OFF;")
        for query in drop_table_queries:
            conn.execute(query)
        conn.execute("PRAGMA foreign_keys = ON;")

        for query in create_table_queries:
            conn.execute(query)

    # Add sample users
    #sample_users = ['Ash', 'Dashiel', 'Nicole', 'Abhishek', 'Bogdan', 'Jeb', 'Matthew', 'Patrick', 'Warren']
    ADD_USERS = False
    if ADD_USERS:
        new_users = ["User 1", "User 2", "User 3", "User 4", "User 5", "User 6", "User 7", "User 8", "User 9", "User 10", "User 11", "User 12", "User 13", "User 14", "User 15", "User 16"]

        for user in new_users:
            add_user(conn, user)

    # Fetch and display all users
    cursor = conn.execute("SELECT * FROM Users;")
    users = cursor.fetchall()
    print(json.dumps(users, indent=2))

    # Close connection
    conn.close()