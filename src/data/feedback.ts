// Where the feedback form sends to (spec §9b). With either left empty, the form's Send opens a filled-in GitHub issue
// instead (docs/feedback-setup.md).
export const feedbackConfig = {
  /** The Worker's address, e.g. "https://shashank662-portfolio.<account>.workers.dev/api/feedback". */
  endpoint: 'https://shashank662-portfolio.shashankhr06.workers.dev/api/feedback',
  /** Turnstile's site key: public by design, unlike its secret. */
  turnstileSiteKey: '0x4AAAAAAFF37ACqi7oChZBh',
};
