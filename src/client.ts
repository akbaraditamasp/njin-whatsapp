import { io } from "socket.io-client";
import whatsapp from "./modules/whatsapp.js";
import "dotenv/config";
import { sendValidator } from "./validators/socket.js";
import pThrottle from "p-throttle";
import logger from "./modules/logger.js";

const throttle = pThrottle({
  limit: 1,
  interval: 2000,
});
const throttled = throttle(async (to, text) => {
  const [id] = (await instance().socket?.onWhatsApp(to)) || [];

  if (id.exists) {
    await instance().socket?.sendMessage(id.jid, {
      text,
    });
  }
});

export const instance = whatsapp(process.env.CLIENT_NAME || "default");

export const socket = io(`http://localhost:${process.env.PORT || 5555}`, {
  auth: {
    as: "server",
    data: {
      id: "default",
    },
  },
});

socket.on("connect", async () => {
  await instance.start();

  socket.on(
    "send",
    async (data: Awaited<ReturnType<typeof sendValidator.validate>>) => {
      try {
        const { id, text, to } = await sendValidator.validate(data);

        if (id === process.env.CLIENT_NAME) {
          await throttled(to, text);
        }
      } catch (e) {
        logger().error(e);
      }
    }
  );
});
socket.on("disconnect", async () => {
  instance.remove();
});
