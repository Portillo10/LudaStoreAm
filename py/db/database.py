from pymongo import MongoClient
from pymongo.database import Database
import os

db: Database = None
connection_string = os.getenv("MONGODB_CNN")


def connect_db():
    global db
    host1, host2, port = connection_string.split(':')
    host = f"{host1}:{host2}"
    if not db:
        try:
            client = MongoClient(host=host, port=int(port))
            db = client["ludastore"]
            print("Connected to database")
        except Exception as error:
            print("Error conectando a la base de datos")
            print(error)

def get_database():
    global db
    return db
