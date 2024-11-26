from simpleDB import Database
from datetime import datetime

class AnalyseDB:

    def __init__(self, db_name="UserInteractions.db"):
        self.DB = Database(db_name)

    def analyze_session_times(self):
        try:
            # Query to get session start and end times
            result, status = self.DB.execute("""SELECT 
                    s.session_id, 
                    MIN(i.timestamp) as start_time, 
                    MAX(i.timestamp) as end_time 
                FROM Sessions s
                JOIN Interactions i ON s.session_id = i.session_id
                GROUP BY s.session_id;
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
                if session_duration > 0:
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


if __name__ == "__main__":
    analyser = AnalyseDB()
    print(analyser.analyze_session_times())