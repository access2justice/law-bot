"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const AWS = __importStar(require("aws-sdk"));
// Initialize the Lambda client
const lambda = new AWS.Lambda();
const handler = async (event) => {
    // Parse the request body
    const data = event.body && JSON.parse(event.body);
    console.log(data);
    console.log(event.path);
    try {
        if (data.type === "url_verification") {
            return {
                statusCode: 200,
                body: JSON.stringify({ challenge: data.challenge }),
            };
        }
        if (!data.event.thread_ts &&
            !data.event.parent_user_id &&
            data.event.type === "message" &&
            data.type === "event_callback" &&
            (data.event.channel === "C06GGJVRMCK" ||
                data.event.channel === "C06HA3ZLB18")) {
            // Setup parameters to invoke the second Lambda function
            const params = {
                FunctionName: "LambdaFunctionSlackWorker", // Specify the second Lambda function name
                InvocationType: "Event", // Use 'Event' for asynchronous execution
                Payload: JSON.stringify({}),
            };
            await lambda.invoke(params).promise();
            // Return a successful response
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Task offloaded successfully to the second Lambda function.",
                }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Task offloaded successfully to the second Lambda function.",
            }),
        };
    }
    catch (error) {
        console.error("Error invoking the second Lambda function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to offload the task to the second Lambda function.",
            }),
        };
    }
};
exports.handler = handler;
