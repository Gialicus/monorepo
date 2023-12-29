import { Collection } from 'mongodb';

export function createWithTimestamp<T = Record<string, unknown>>(
  collection: Collection
) {
  return async function (payload: T) {
    const doc = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const insertedResult = await collection.insertOne(doc);
    return { _id: insertedResult.insertedId, ...doc };
  };
}
