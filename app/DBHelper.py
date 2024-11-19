from simpleDB import Database
from datetime import datetime

class LoggerDB:

    def __init__(self, db_name="UserInteractions.db"):
        self.DB = Database(db_name)

    def new_session(self, user_id: str):
        try:
            # Insert the new session and retrieve the session_id
            result, status = self.DB.execute(
                "INSERT INTO Sessions (user_id) VALUES (?) RETURNING session_id;",
                (user_id,)
            )
            
            if status and result:
                return result[0]['session_id']
            else:
                print("Error inserting or retrieving the session_id.")
                return None

        except Exception as e:
            print(f"An error occurred: {e}")
            return None
        
    def log_interaction(self, interaction, user_id, session_id):
        try:
            # Insert into Interactions table and retrieve interaction_id
            result, status = self.DB.execute(
                "INSERT INTO Interactions (user_id, event, session_id) VALUES (?, ?, ?) RETURNING interaction_id;",
                (user_id, interaction["event"], session_id)
            )

            if not status or not result:
                print("Error inserting interaction.")
                return None

            interaction_id = result[0]['interaction_id']

            # Process only if the event involves cards
            if interaction["event"] in ["DECOUPLE", "COMBINE", "EDIT"]:
                cards = interaction["cards"]
                for card in cards:
                    original_text = card.get("original_text", "")
                    final_text = card.get("final_text", "")

                    # Insert into Cards table and retrieve card_id
                    card_result, status = self.DB.execute(
                        "INSERT INTO Cards (interaction_id, original_text, final_text) VALUES (?, ?, ?) RETURNING card_id;",
                        (interaction_id, original_text, final_text)
                    )

                    if not status or not card_result:
                        print("Error inserting card.")
                        return None

                    card_id = card_result[0]['card_id']

                    # Insert associated words into Words table
                    for word in card.get("words", []):
                        self.DB.execute(
                            "INSERT INTO Words (word, card_id) VALUES (?, ?);",
                            (word, card_id)
                        )

            return interaction_id

        except Exception as e:
            print(f"An error occurred: {e}")
            return None
        

if __name__ == "__main__":
    db = LoggerDB("UserTest.db")

    # Sample interaction data for ADD event
    interaction_add = {
        "event": "ADD"
    }

    db.log_interaction(interaction_add, 1, 1)

    # Sample interaction data for DECOUPLE event
    interaction_decouple = {
        "event": "DECOUPLE",
        "cards": [
            {
                "original_text": "Hello World, Goodbye Mars!",
                "final_text": "Hello World",
                "words": ["Hello", "World"]
            },
            {
                "original_text": "Hello World, Goodbye Mars!",
                "final_text": "Bye Mars",
                "words": ["Bye", "Mars"]
            }
        ]
    }
    db.log_interaction(interaction_decouple, 1, 2)

    import time
    time.sleep(2)

    # Sample interaction data for COMBINE event
    interaction_combine = {
        "event": "COMBINE",
        "cards": [
            {
                "original_text": "Good Morning",
                "final_text": "Good Morning Everyone",
                "words": ["Good", "Morning"]
            },
            {
                "original_text": "Everyone",
                "final_text": "Good Morning Everyone",
                "words": ["Everyone"]
            }
        ]
    }
    db.log_interaction(interaction_combine, 1, 2)

    time.sleep(3)

    # Sample interaction data for EDIT event
    interaction_edit = {
        "event": "EDIT",
        "cards": [
            {
                "original_text": "The quick brown fox",
                "final_text": "The quick brown fox jumps",
                "words": ["brown", "fox"]
            }
        ]
    }
    db.log_interaction(interaction_edit, 1, 2)
