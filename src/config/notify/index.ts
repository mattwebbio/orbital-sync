import { NotifyExceptionsConfig } from './exceptions.js';
import { NotifySmtpConfig } from './smtp.js';

export interface NotifyConfig {
  onSuccess: boolean;
  onFailure: boolean;
  smtp: NotifySmtpConfig;
  exceptions: NotifyExceptionsConfig;
}
