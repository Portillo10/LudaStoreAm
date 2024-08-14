from db.database import get_database


def create_item(item):
    db = get_database()
    collection = db["items"]
    result = collection.insert_one(item)
    return result.inserted_id


def get_items():
    db = get_database()
    collection = db["items"]
    result = collection.find({}, {'_id': 0})
    return result


def get_item_by_sku(sku):
    db = get_database()
    collection = db["items"]
    result = collection.find_one(
        {'sku': sku}, {'_id': 0, 'title': 0, 'state': 0})
    return result


def update_price(sku, new_price):
    db = get_database()
    collection = db["items"]
    result = collection.update_one(
        {'sku': sku}, {'$set': {'price': new_price}})
    return result.modified_count > 0
