import { joi } from '@etfm/shared'

export function getSchemas(): Record<string, (Joi: joi.Root) => any> {
  return {
    npmClient: (Joi) => Joi.string(),
    plugins: (Joi) => Joi.array().items(Joi.string()),
  }
}
