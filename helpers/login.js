import { ddbDocClient } from './dynamoClient.js';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';

export function login(username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await ddbDocClient.send(new QueryCommand({
          TableName: 'Users',
          KeyConditionExpression: 'username = :u',
          ExpressionAttributeValues: {
            ':u': username,
          },
          Limit: 1
        }));
  
        if (!result.Items || result.Items.length === 0) {
          return reject(new Error('User not found'));
        }
  
        const user = result.Items[0];
  
        const isMatch = await bcrypt.compare(password, user.password);
  
        if (!isMatch) {
          return reject(new Error('Incorrect password'));
        }
  
        // You can return any relevant user data here
        resolve({ success: true, user });
  
      } catch (err) {
        reject(err);
      }
    });
  }
  
