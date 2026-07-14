import axios from "axios";
import config from "../config";

export interface PaypalTokenResponse {
  scope?: string;
  access_token: string;
  token_type: string;
  app_id?: string;
  expires_in: number;
  nonce?: string;
}

const generatePaypalAccessToken = async (): Promise<PaypalTokenResponse> => {
  const baseUrl = config.payment_getway_credentials?.paypal_base_url;
  const clientId = config.payment_getway_credentials?.paypal_client_id;
  const clientSecret = config.payment_getway_credentials?.paypal_client_secret;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials in config.payment_getway_credentials");
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/v1/oauth2/token`;

  const body = new URLSearchParams({ grant_type: "client_credentials" }).toString();

  const res = await axios.post<PaypalTokenResponse>(
    url,
    body,
    {
      auth: {
        username: clientId,
        password: clientSecret,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
     
    }
  );

  return res.data;
};

export default generatePaypalAccessToken;
