export type NotifySmtpConfig = DisabledSmtpConfig | EnabledSmtpConfig;

export interface DisabledSmtpConfig {
  enabled: false;
}

export interface EnabledSmtpConfig {
  enabled: true;
  host: string;
  port: string;
  tls: boolean;
  user: string | undefined;
  password: string | undefined;
  from: string | undefined;
  to: string | undefined;
}
