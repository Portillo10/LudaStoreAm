from db.database import get_database

categories = [
  "MCO180917",
  "MCO180916",
  "MCO118195",
  "MCO167690",
  "MCO411151",
  "MCO417111",
  "MCO167689",
  "MCO180934",
  "MCO429448",
  "MCO181041",
  "MCO417771",
  "MCO432665",
  "MCO1259",
  "MCO181044",
  "MCO118198",
  "MCO412010",
  "MCO118193",
  "MCO118192",
  "MCO181042",
  "MCO181040",
  "MCO118191",
  "MCO118190",
  "MCO457403",
  "MCO441231",
  "MCO180928",
  "MCO157400",
  "MCO118184",
  "MCO429392",
  "MCO157399",
  "MCO157396",
  "MCO181069",
  "MCO157398",
  "MCO167683",
  "MCO416984",
  "MCO167685",
  "MCO4597",
  "MCO4598",
  "MCO180960",
  "MCO417035",
  "MCO181090",
  "MCO118188",
  "MCO441193",
  "MCO180969",
  "MCO180965",
  "MCO8830",
]

def get_links():
    db = get_database()
    collection = db["postedlinks"]
    result = collection.find({"updated":False, "category_id":{"$in":categories}})
    return result

def updated_state(id):
    db = get_database()
    collection = db["postedlinks"]
    result = collection.update_one({"_id":id}, {"$set":{"updated": True}})
    return result.modified_count > 0

def revert_update():
    db = get_database()
    collection = db["postedlinks"]
    result = collection.update_many({}, {"$set":{"updated": False}})
    return result.modified_count > 0