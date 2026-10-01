# SECURITY RULE: SECRETS, CREDENTIALS AND TOKENS REDACTION POLICY

## STRICT REQUIREMENT
1. **Never print plain-text secrets**: Under no circumstances should actual production or development secret tokens, API keys, private keys, passwords, or authentication credentials be printed in plain text in user reports, summaries, tool outputs, or conversation transcripts.
2. **Redaction Standard**:
   - Always replace secret values with `***REDACTED***` or use descriptive status phrases such as `[Token verified - value masked]`.
   - In logs or diffs, mask the value: e.g., `CASTLE_GATEWAY_TOKEN=***REDACTED***` or `?token=***REDACTED***`.
3. **Applies to all sensitive parameters**:
   - `CASTLE_GATEWAY_TOKEN`
   - `VITE_GATEWAY_TOKEN`
   - `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`
   - Firebase private keys, Stripe secret keys, JWT secrets, database connection strings.
4. **Permanent Enforcement**: This rule is absolute, perpetual, and takes precedence over detailed reporting requirements.
