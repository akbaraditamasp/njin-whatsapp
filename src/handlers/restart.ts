import { Socket } from "socket.io";
import { serverInfoValidator } from "../validators/socket.js";
import restartPM2 from "../utils/restart_pm2.js";

export default async function restart(
  _socket: Socket,
  data: Awaited<ReturnType<typeof serverInfoValidator.validate>>
) {
  const { id } = await serverInfoValidator.validate(data);

  restartPM2(id);
}
