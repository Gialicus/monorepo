import { Collection, ObjectId } from 'mongodb';

export function deleteById(
  collection: Collection,
  soft: 'soft' | 'hard' = 'hard'
) {
  return async function (id: string | ObjectId) {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    return soft === 'hard'
      ? collection.deleteOne({ _id })
      : collection.updateOne({ _id }, { $set: { deletedAt: new Date() } });
  };
}
