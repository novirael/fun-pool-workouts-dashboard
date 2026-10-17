// Stable error codes returned by the API as { error: code }. The client maps them to localized text.
export type ApiErrorCode =
  | 'unauthorized'
  | 'invalid_password'
  | 'not_configured'
  | 'member_unknown'
  | 'forbidden'
  | 'not_found'
  | 'last_parent'
  | 'in_use'
  | 'too_many'
  | 'validation'
  | 'bad_request'
  | 'server_error';
