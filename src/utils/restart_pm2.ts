import pm2 from "pm2";

export default function restartPM2(id: string) {
  return new Promise<void>((res, rej) => {
    pm2.connect((err) => {
      if (err) return rej(err);

      pm2.list((err, list) => {
        if (err) {
          pm2.disconnect();
          return rej(err);
        }

        const name = list.find((el) => el.name === `wa_${id}`)?.name;

        if (name) {
          pm2.restart(name, (err) => {
            pm2.disconnect();
            if (err) return rej(err);

            res();
          });
        }
      });
    });
  });
}
