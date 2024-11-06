import { Socket } from "socket.io";
import { serverInfoValidator } from "../validators/socket.js";
import { clients } from "../server.js";
import startPM2 from "../utils/start_pm2.js";

export default async function updateInfo(
  socket: Socket,
  data: Awaited<ReturnType<typeof serverInfoValidator.validate>>
) {
  const { id } = await serverInfoValidator.validate(data);
  let client = clients.find((el) => el.data.id === id);

  if (!client) {
    await startPM2(id);
    client = clients.find((el) => el.data.id === id);
  }

  socket.emit("connection_update", client?.data);
}
