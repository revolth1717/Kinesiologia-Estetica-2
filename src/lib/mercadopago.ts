import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN || '';

const client = new MercadoPagoConfig({ accessToken: accessToken });

export const preference = new Preference(client);
export const payment = new Payment(client);
