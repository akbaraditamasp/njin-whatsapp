import { Boom } from "@hapi/boom";
import {
  DisconnectReason,
  makeWASocket,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { rmSync } from "fs";
import { resolve } from "path";
import { socket as io } from "../client.js";
import logger from "./logger.js";

export type Whatsapp = {
  id: string;
  connected: boolean;
  socket?: ReturnType<typeof makeWASocket>;
  qr?: string;
};

export default function whatsapp(id: string) {
  const data: Whatsapp = {
    id,
    connected: false,
  };

  const remove = () => {
    data.connected = false;

    data.socket?.ev.removeAllListeners("connection.update");
    data.socket?.ev.removeAllListeners("creds.update");
    data.socket?.ev.removeAllListeners("messages.upsert");

    data.socket?.end(undefined);
  };

  const start = async () => {
    remove();

    const { state, saveCreds } = await useMultiFileAuthState(
      resolve("auths", data.id)
    );

    data.socket = makeWASocket({
      auth: state,
      logger: logger.toFile(id) as any,
    });

    data.socket.ev.on("connection.update", async (socket) => {
      const { connection, lastDisconnect, qr } = socket;

      data.qr = qr;

      if (connection === "close") {
        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode ===
          DisconnectReason.loggedOut
        ) {
          rmSync(resolve("auths", data.id), { recursive: true });
          remove();
        }

        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.connectionReplaced &&
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.connectionLost
        ) {
          await start();
        }
      } else if (connection === "open") {
        data.connected = true;
      }

      io.emit("connection_update", {
        id: data.id,
        connected: data.connected,
        qr: data.qr,
      });
    });

    data.socket.ev.on("creds.update", saveCreds);

    data.socket.ev.on("messages.upsert", (data): void => {
      for (const message of data.messages) {
        io.emit("upsert", message);
      }
    });
  };

  return Object.assign(() => data, { remove, start });
}
