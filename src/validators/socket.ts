import vine from "@vinejs/vine";

export const serverInfoValidator = vine.compile(
  vine.object({
    id: vine.string(),
  })
);

export const sendValidator = vine.compile(
  vine.object({
    id: vine.string(),
    to: vine.string().mobile(),
    text: vine.string(),
  })
);
