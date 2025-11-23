import { APIGatewayProxyHandler } from 'aws-lambda';

const allowedOrigins = [
  "http://localhost:5173"
];

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin =
     event.headers?.origin ||
     event.headers?.Origin || // some browsers send 'Origin'
     "";

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : "",
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify({})
  };
};
