import { Model } from './model';
import { debug } from './../logger';

class List extends Model {

  static get tableName() {
    return process.env.LISTS_TABLE;
  }

  static get hashKey() {
    return 'userId';
  }

  static get rangeKey() {
    return 'id';
  }

  static updateImportStatus(userId, listId, fileName, status) {
    debug('= List.updateStatus', userId, listId, fileName, status);
    const addParams = {
      Key: {
        userId,
        id: listId
      },
      TableName: this.tableName,
      UpdateExpression: 'SET #importStatus.#fileName = :newStatus',
      ExpressionAttributeNames: {
        '#importStatus': 'importStatus',
        '#fileName': fileName
      },
      ExpressionAttributeValues: {
        ':newStatus': status
      }
    };
    return this._client('update', addParams);
  }
}

module.exports.List = List;
