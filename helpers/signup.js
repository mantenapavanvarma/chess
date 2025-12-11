import { ddbDocClient } from './dynamoClient.js';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export function signup(username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if username exists
        const usernameCheck = await ddbDocClient.send(new QueryCommand({
          TableName: 'Users',
          KeyConditionExpression: 'username = :u',
          ExpressionAttributeValues: { ':u': username },
          Limit: 1
        }));
  
        if (usernameCheck.Items.length > 0) {
          return reject(new Error('Username already exists'));
        }
  
        // Generate unique user_id and ensure it doesn't exist
        let user_id = uuidv4();
        let exists = true;
  
        while (exists) {
          const idCheck = await ddbDocClient.send(new QueryCommand({
            TableName: 'Users',
            KeyConditionExpression: 'username = :u AND user_id = :id',
            ExpressionAttributeValues: {
              ':u': username,
              ':id': user_id
            }
          }));
          exists = idCheck.Items.length > 0;
          if (exists) user_id = uuidv4();
        }
  
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const newUser = { username, user_id, password: hashedPassword };
  
        await ddbDocClient.send(new PutCommand({
          TableName: 'Users',
          Item: newUser
        }));
  
        resolve({ success: true });
  
      } catch (err) {
        reject(err);
      }
    });
  }  
