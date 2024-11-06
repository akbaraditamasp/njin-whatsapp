import { Socket } from "socket.io";
import { clients } from "../server.js";
import { sendValidator } from "../validators/socket.js";

export default async function send(
  _socket: Socket,
  data: Awaited<ReturnType<typeof sendValidator.validate>>
) {
  const { text, id, to } = await sendValidator.validate(data);

  const client = clients.find((el) => el.data.id === id);

  if (client?.data.connected) {
    client.socket.emit("send", {
      id,
      text,
      to,
    });
  }
}
