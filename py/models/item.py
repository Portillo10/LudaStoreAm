from db.database import get_database


def create_item(item):
    db = get_database()
    collection = db["products"]
    result = collection.insert_one(item)
    return result.inserted_id


def get_items():
    db = get_database()
    collection = db["products"]
    result = collection.find({}, {'_id': 0})
    return result


def get_item_by_sku(sku):
    db = get_database()
    collection = db["products"]
    result = collection.find_one(
        {'sku': sku, 'state':{"$in":["active", "updated"]}}, {'_id': 0, 'title': 0, 'state': 0})
    return result


def update_price(sku, new_price):
    db = get_database()
    collection = db["products"]
    result = collection.update_one(
        {'sku': sku }, {'$set': {'price': new_price, 'state':"re-updated"}})
    return result.modified_count > 0

def set_revised_state(sku):
    db = get_database()
    collection = db["products"]
    result = collection.update_one(
        {'sku': sku }, {'$set': {'state':"revised"}})
    return result.modified_count > 0