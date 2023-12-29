import { Collection, ObjectId } from 'mongodb';

export function findById(collection: Collection) {
  return function (id: string | ObjectId) {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id });
  };
}
