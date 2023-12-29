import { Collection, ObjectId } from 'mongodb';
import { findById } from './find-by-id';

export function updateWithTimestamp<T = Record<string, unknown>>(
  collection: Collection,
  fullDocument = true
) {
  return async function (id: string | ObjectId, payload: T) {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    const data = {
      ...payload,
      updatedAt: new Date(),
    };
    await collection.updateOne(
      { _id },
      {
        $set: data,
      }
    );
    if (fullDocument) {
      const updated = await findById(collection)(_id);
      return updated;
    } else {
      return { _id };
    }
  };
}
