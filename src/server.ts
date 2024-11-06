import "dotenv/config";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { serverInfoValidator } from "./validators/socket.js";
import logger from "./modules/logger.js";
import handlers from "./handlers/index.js";

export const http = createServer();
export const server = new Server(http, {
  cors: {
    origin: "*",
  },
});

export const clients: {
  socket: Socket;
  data: {
    id: string;
    connected: boolean;
    qr?: string;
  };
}[] = [];

(async () => {
  server.use(async (socket, next) => {
    const { as, data } = socket.handshake.auth;

    try {
      if (as === "server") {
        const { id } = await serverInfoValidator.validate(data);

        const client = clients.find((el) => el.data.id === id);
        if (!client) {
          clients.push({
            data: {
              id,
              connected: false,
            },
            socket,
          });
        } else {
          client.socket = socket;
        }

        next();
      } else {
        next();
      }
    } catch (e) {
      next(new Error("Unauthenticated"));
    }
  });

  server.on("connection", (socket: Socket) => {
    const client = clients.find((el) => el.socket.id === socket.id);

    if (client) {
      socket.on("connection_update", (data: (typeof clients)[0]["data"]) => {
        client.data = data;
        server.to("clients").emit("connection_update", data);
      });
      socket.on("upsert", (data) => {
        server.to("clients").emit("upsert", { client: client.data, data });
      });
    } else {
      socket.join("clients");

      for (const event in handlers) {
        const handler = handlers[event as keyof typeof handlers];

        socket.on(event, async (data) => {
          try {
            await handler(socket, data);
          } catch (e) {
            logger().error(e);
          }
        });
      }
    }
  });

  http.listen(Number(process.env.PORT || 5555));
})();
