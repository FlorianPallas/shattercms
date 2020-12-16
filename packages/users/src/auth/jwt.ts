import jwt from 'jsonwebtoken';
import { ModuleConfig } from '..';

export const sign = (
  config: Partial<ModuleConfig> = {},
  payload: any,
  type: 'access' | 'refresh'
) => {
  if (!config.jwtSecret) {
    console.log('Failed to sign, there was no secret key assigned');
    return;
  }

  try {
    const token = jwt.sign(
      {
        $t: type, // Pass token type
        ...payload,
      },
      config.jwtSecret,
      {
        algorithm: 'RS512',
        expiresIn: type === 'access' ? '10m' : '1y',
      }
    );
    return token;
  } catch (error) {
    console.log(error);
    return;
  }
};

export const verify = (
  config: Partial<ModuleConfig> = {},
  token: string,
  type?: 'access' | 'refresh'
) => {
  if (!config.jwtSecret) {
    console.log('Failed to verify, there was no secret key assigned');
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['RS512'],
    }) as { [key: string]: any };
    if (type && type !== payload.$t) {
      console.log('Failed to verify, unexpected token type');
      return;
    }
    return payload;
  } catch (error) {
    console.log(error);
    return;
  }
};
