import sqlitecloud

def dict_row_factory(cursor, row):
    """Convert row tuples to dictionaries with column names as keys."""
    columns = [col[0] for col in cursor.description]  # Get column names
    return {columns[i]: row[i] for i in range(len(row))}  # Map column names to row values


class LoggerDB:
    def __init__(self, db_connection, db_name = 'UserInteractions'):
        self.conn = sqlitecloud.connect(db_connection)
        self.conn.row_factory = dict_row_factory
        self.conn.execute(f"USE DATABASE {db_name}")

    def new_session(self, user_id: str):
        try:
            query = "INSERT INTO Sessions (user_id) VALUES (?) RETURNING session_id;"
            cursor = self.conn.execute(query, (user_id,))
            result = cursor.fetchone()
            self.conn.commit()
            return result['session_id'] if result else None
        except Exception as e:
            print(f"Error during session creation: {e}")
            return None

    def get_favourites(self, user_id: str, session_id: str):
        query = """SELECT f.text FROM Favourites f LEFT JOIN Unfavourites u ON f.text = u.text AND f.user_id = u.user_id JOIN Interactions i ON f.interaction_id = i.interaction_id WHERE f.user_id = ? AND i.session_id = ? AND u.unfavourite_id IS NULL;"""
        cursor = self.conn.execute(query, (user_id, session_id))
        return [row['text'] for row in cursor.fetchall()]

    def get_all_favourites(self, user_id: str):
        query = """SELECT f.text FROM Favourites f LEFT JOIN Unfavourites u ON f.text = u.text AND f.user_id = u.user_id WHERE f.user_id = ? AND u.unfavourite_id IS NULL;"""
        cursor = self.conn.execute(query, (user_id,))
        return [row['text'] for row in cursor.fetchall()]

    def log_interaction(self, interaction, user_id, session_id):
        try:
            query = "INSERT INTO Interactions (user_id, event, session_id) VALUES (?, ?, ?) RETURNING interaction_id;"
            cursor = self.conn.execute(query, (user_id, interaction["event"], session_id))
            result = cursor.fetchone()
            if not result:
                print("Error inserting interaction.")
                return None
            interaction_id = result['interaction_id']

            if interaction["event"] in ["DECOUPLE", "COMBINE", "EDIT", "REGENERATE"]:
                for card in interaction["cards"]:
                    card_query = """INSERT INTO Cards (interaction_id, original_text, final_text) VALUES (?, ?, ?) RETURNING card_id;"""
                    card_cursor = self.conn.execute(card_query, (interaction_id, card.get("original_text", ""), card.get("final_text", "")))
                    card_result = card_cursor.fetchone()
                    if not card_result:
                        print("Error inserting card.")
                        return None

                    card_id = card_result['card_id']
                    for word in card.get("words", []):
                        word_query = "INSERT INTO Words (word, card_id) VALUES (?, ?);"
                        self.conn.execute(word_query, (word, card_id))

            elif interaction["event"] == "LIKE":
                like_query = "INSERT INTO Favourites (text, user_id, interaction_id) VALUES (?, ?, ?);"
                self.conn.execute(like_query, (interaction["text"], user_id, interaction_id))

            elif interaction["event"] == "UNLIKE":
                unlike_query = "INSERT INTO Unfavourites (text, user_id, interaction_id) VALUES (?, ?, ?);"
                self.conn.execute(unlike_query, (interaction["text"], user_id, interaction_id))

            self.conn.commit()
            return interaction_id
        except Exception as e:
            print(f"Error logging interaction: {e}")
            return None


if __name__ == "__main__":

    logger = LoggerDB()

    logger.new_session(1)
    logger.new_session(1)

    # Sample interaction
    interaction_add = {"event": "ADD"}
    logger.log_interaction(interaction_add, 1, 1)

    interaction_decouple = {
        "event": "DECOUPLE",
        "cards": [ 
            {"original_text": "Hello World, Goodbye Mars!", "final_text": "Hello World", "words": ["Hello", "World"]},
            {"original_text": "Hello World, Goodbye Mars!", "final_text": "Bye Mars", "words": ["Bye", "Mars"]}
        ]
    }
    logger.log_interaction(interaction_decouple, 1, 2)
