import { resolve } from "path";
import { default as pino } from "pino";
import pinoPretty from "pino-pretty";
import SonicBoom from "sonic-boom";

function logger() {
  const logger = pino.default(
    pino.transport({
      target: "pino-pretty",
    })
  );

  const toFile = (id: string) =>
    pino.default(
      pinoPretty({
        colorize: false,
        destination: new SonicBoom.SonicBoom({
          dest: resolve("logs", `${id}.log`),
          mkdir: true,
        }),
      })
    );

  return Object.assign(() => logger, { toFile });
}

export default logger();
