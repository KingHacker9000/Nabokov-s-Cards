from CloudDBHelper import dict_row_factory
import sqlitecloud

from datetime import datetime
from collections import Counter

from request_analyze import fetch_data_from_database

from dotenv import load_dotenv
import os
load_dotenv(override=True)

class AnalyzeRequest:

    def __init__(self, user_id=1):
        self.user_id = user_id
        self.conn = sqlitecloud.connect(os.environ['SQLite_Connection'] + 'apikey='+ os.environ['SQLite_apikey'])
        self.conn.row_factory = dict_row_factory
        self.conn.execute("USE DATABASE UserInteractions")

    def get_interaction_data(self):
        try:
            query = "SELECT * FROM Interactions;"
            cursor = self.conn.execute(query)
            result = cursor.fetchall()
            print(result)
        except Exception as e:
            print(f"Error during session creation: {e}")
            return None

    def analyze_session_times(self):
        DURATION_THRESHOLD = 0
        try:
            # Query to get session start and end times
            result, status = fetch_data_from_database(f"""SELECT s.session_id, MIN(i.timestamp) as start_time, MAX(i.timestamp) as end_time FROM Sessions s JOIN Interactions i ON s.session_id = i.session_id WHERE s.user_id=1 GROUP BY s.session_id;
            """)

            #print(status, result)
            if not status or not result:
                
                print("Error fetching session data.")
                return None

            session_times = []
            total_time = 0

            for row in result:
                session_id, start_time, end_time = row["session_id"], row["start_time"], row["end_time"]
                start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
                end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
                session_duration = (end_time - start_time).total_seconds() / 60  # Duration in minutes
                if session_duration > DURATION_THRESHOLD:
                    session_times.append(session_duration+1)
                    total_time += session_duration+1

            num_sessions = len(session_times)
            avg_time = total_time / num_sessions if num_sessions > 0 else 0

            return {
                "session_times": session_times,
                "total_time": total_time,
                "num_sessions": num_sessions,
                "average_time": avg_time
            }

        except Exception as e:
            print(f"An error occurred during session time analysis: {e}")
            return None
        

    def analyze_interactions_per_session(self):
        INTERACTION_THRESHOLD = 1
        try:
            # Query to count interactions per session
            result, status = fetch_data_from_database(f"""SELECT session_id, COUNT(*) as interaction_count
                FROM Interactions
                WHERE user_id={self.user_id}
                GROUP BY session_id;
            """)

            if not status or not result:
                print("Error fetching interaction data.")
                return None

            interactions = [row["interaction_count"] for row in result if row["interaction_count"] > INTERACTION_THRESHOLD]
            total_interactions = sum(interactions)
            num_sessions = len(interactions)
            avg_interactions = total_interactions / num_sessions if num_sessions > 0 else 0

            return {
                "total_interactions": total_interactions,
                "num_sessions": num_sessions,
                "average_interactions": avg_interactions
            }

        except Exception as e:
            print(f"An error occurred during interaction analysis: {e}")
            return None
        

    def analyze_usage_by_time_of_day(self):
        try:
            # Query to get interaction timestamps
            result, status = fetch_data_from_database(f"""SELECT strftime('%H', timestamp) as hour_of_day
                FROM Interactions
                WHERE user_id={self.user_id};
            """)

            if not status or not result:
                print("Error fetching timestamp data.")
                return None

            # Count interactions by hour
            hour_counts = Counter(int(row["hour_of_day"]) for row in result)
            most_active_hour = max(hour_counts, key=hour_counts.get) if hour_counts else None

            return {
                "hour_counts": dict(hour_counts),
                "most_active_hour": most_active_hour
            }

        except Exception as e:
            print(f"An error occurred during time-of-day analysis: {e}")
            return None
        
    def analyze_text_edits(self):
        try:
            # Query to count EDIT events
            result, status = fetch_data_from_database(f"""SELECT COUNT(*) as edit_count
                FROM Interactions
                WHERE event = 'EDIT' AND user_id={self.user_id};
            """)

            if not status or not result:
                print("Error fetching edit data.")
                return None

            edit_count = result[0]["edit_count"]
            return {"edit_count": edit_count}

        except Exception as e:
            print(f"An error occurred during text edit analysis: {e}")
            return None


    def analyze_text_edit_amount(self):
        try:
            # Query to calculate edit amount
            result, status = fetch_data_from_database(f"""SELECT original_text, final_text
                FROM Cards
                WHERE interaction_id IN (
                    SELECT interaction_id
                    FROM Interactions
                    WHERE event = 'EDIT' AND user_id={self.user_id}
                );
            """)

            if not status or not result:
                print("Error fetching text edit data./ No Edits Yet!")
                return None

            total_changes = 0
            for row in result:
                original = row["original_text"]
                final = row["final_text"]
                changes = []
                if original and final:
                    # Calculate percentage change based on character count
                    changes.append(abs(len(final) - len(original)))

            return {"total_changes": sum(changes), "changes_count": len(changes), "mean_changes": sum(changes)/len(changes)}

        except Exception as e:
            print(f"An error occurred during text edit amount analysis: {e}")
            return None

    def analyze_card_combinations(self):
        try:
            # Query to count COMBINE events
            result, status = fetch_data_from_database(f"""SELECT COUNT(*) as combine_count
                FROM Interactions
                WHERE event = 'COMBINE' AND user_id={self.user_id};
            """)

            if not status or not result:
                print("Error fetching combine data.")
                return None

            combine_count = result[0]["combine_count"]
            return {"combine_count": combine_count}

        except Exception as e:
            print(f"An error occurred during card combination analysis: {e}")
            return None

    def analyze_combination_nature(self):
        try:
            # Query to analyze nature of combinations
            result, status = fetch_data_from_database(f"""SELECT original_text, final_text
                FROM Cards
                WHERE interaction_id IN (
                    SELECT interaction_id
                    FROM Interactions
                    WHERE event = 'COMBINE' AND user_id={self.user_id}
                );
            """)

            if not status or not result:
                print("Error fetching combination data.")
                return None

            word_combine = 0
            sentence_combine = 0
            paragraph_combine = 0

            for row in result:
                original = row["original_text"]
                final = row["final_text"]
                if original and final:

                    if len(final) > len(original)*2 and len(original) > 20:
                        paragraph_combine += 1
                    elif len(final.split(".")) > len(original.split(".")):
                        sentence_combine += 1
                    else:
                        word_combine += 1

            return {
                "word_combine": word_combine,
                "sentence_combine": sentence_combine,
                "paragraph_combine": paragraph_combine
            }

        except Exception as e:
            print(f"An error occurred during combination nature analysis: {e}")
            return None
        
    def analyze_card_decouples(self):
        try:
            # Query to count DECOUPLE events
            result, status = fetch_data_from_database(f"""SELECT COUNT(*) as decouple_count
                FROM Interactions
                WHERE event = 'DECOUPLE' AND user_id={self.user_id};
            """)

            if not status or not result:
                print("Error fetching decouple data.")
                return None

            decouple_count = result[0]["decouple_count"]
            return {"decouple_count": decouple_count}

        except Exception as e:
            print(f"An error occurred during card decoupling analysis: {e}")
            return None
    
    def analyze_card_regenerations(self):
        try:
            # Query to count DECOUPLE events
            result, status = fetch_data_from_database(f"""SELECT COUNT(*) as regenerate_count
                FROM Interactions
                WHERE event = 'REGENERATE' AND user_id={self.user_id};
            """)

            if not status or not result:
                print("Error fetching regenerate data.")
                return None

            regenerate_count = result[0]["regenerate_count"]
            return {"regenerate_count": regenerate_count}

        except Exception as e:
            print(f"An error occurred during card regeneration analysis: {e}")
            return None
        
    def analyze_card_event(self, event: str):
        try:
            # Query to count DECOUPLE events
            result, status = fetch_data_from_database(f"""SELECT COUNT(*) as event_count
                FROM Interactions
                WHERE event='{event}' AND user_id={self.user_id};
            """)

            if not status or not result:
                print(f"Error fetching {event} data.")
                return None

            event_count = result[0]["event_count"]
            return {"event": event, "event_count": event_count}

        except Exception as e:
            print(f"An error occurred during card event analysis: {e}")
            return None

    def analyze_stash_stages(self):
        try:
            # Query to count combines before each stash
            result, status = fetch_data_from_database(f"""SELECT interaction_id, event
                FROM Interactions
                WHERE event IN ('COMBINE', 'STASH') AND user_id={self.user_id}
                ORDER BY timestamp;
            """)

            if not status or not result:
                print("Error fetching stash stage data.")
                return None

            combine_before_stash = []
            combine_count = 0

            for row in result:
                if row["event"] == "COMBINE":
                    combine_count += 1
                elif row["event"] == "STASH":
                    combine_before_stash.append(combine_count)
                    combine_count = 0

            return {"combine_before_stash": combine_before_stash}

        except Exception as e:
            print(f"An error occurred during stash stage analysis: {e}")
            return None


if __name__ == "__main__":
    analyser = AnalyzeRequest(1)
    analyser.get_interaction_data()
    # print(analyser.analyze_session_times())
    # print(analyser.analyze_interactions_per_session())
    # print(analyser.analyze_usage_by_time_of_day())
    # print(analyser.analyze_text_edits())
    # print(analyser.analyze_text_edit_amount())
    # print(analyser.analyze_card_combinations())
    # print(analyser.analyze_combination_nature())
    # print(analyser.analyze_card_decouples())
    # print(analyser.analyze_card_regenerations())
    # print(analyser.analyze_card_event("DELETE"))
    # print(analyser.analyze_card_event("STASH"))
    # print(analyser.analyze_stash_stages())