import dotenv from "dotenv";
import { connect } from "amqplib";

dotenv.config();
function createConnection() {
  let channel;
  return async () => {
    console.log("Rabbitmq connection stablished");

    if (channel) return channel;
    const rabbitMq = await connect({
      username: process.env.RABBITMQ_DEFAULT_USER,
      password: process.env.RABBITMQ_DEFAULT_PASS
    });

    channel = await rabbitMq.createChannel();
    return channel;
  }
}

const connection = createConnection();
const broker = await connection();
export { broker };