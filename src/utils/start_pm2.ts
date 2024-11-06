import { resolve } from "path";
import pm2 from "pm2";

export default function startPM2(id: string) {
  return new Promise<void>((res, rej) => {
    pm2.connect((err) => {
      if (err) return rej(err);

      pm2.start(
        {
          cwd: resolve(),
          name: "wa_" + id,
          script: "npm",
          args:
            process.env.NODE_ENV === "production"
              ? "run start:client"
              : "run dev:client",
          env: {
            CLIENT_NAME: id,
            PORT: process.env.PORT || "5555",
          },
          cron: "*/20 * * * *",
          autorestart: true,
        },
        (err) => {
          pm2.disconnect();

          if (err) return rej(err);

          res();
        }
      );
    });
  });
}
