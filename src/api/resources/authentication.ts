import { ValidationError } from '../errors.js';
import type {
	IApiKeyResponse,
	IEmptyResult,
	ILoginResponse,
	IMaskedApiKeyResponse,
	IMfaReauthPayload,
	IMfaRecoveryCodes,
	IMfaStatus,
	IMfaVerifyPayload,
	IStatusResponse,
	ITotpConfirmPayload,
	ITotpEnrollment,
	SocialLoginProvider,
} from '../types.js';
import { publicRequestConfig } from '../utils.js';
import { BaseResource } from './base.js';

/** Two-factor re-authentication requires the password or a live/recovery code. */
function requireReauth(payload: IMfaReauthPayload): IMfaReauthPayload {
	if (!payload?.password && !payload?.code) {
		throw new ValidationError('password or code is required');
	}
	return payload;
}

/**
 * Authentication endpoints (login, two-factor, social login, password
 * management), personal API key management (`/users/api-keys`), and
 * two-factor enrollment (`/users/self/mfa`).
 *
 * Most of these endpoints are intended to bootstrap an authenticated session
 * for a human user. Production server-to-server integrations should use
 * `X-Api-Key` and skip this resource entirely.
 */
export class AuthenticationResource extends BaseResource {
	/** `POST /login` — exchange email + password for a JWT access token. */
	async login(email: string, password: string): Promise<ILoginResponse> {
		if (!email) throw new ValidationError('email is required');
		if (!password) throw new ValidationError('password is required');
		return this.call('Login failed', () =>
			this.http.post('/login', { email, password }, publicRequestConfig()),
		);
	}

	/**
	 * `POST /authentication/mfa/verify` — exchange the login `mfa_token` and an
	 * authenticator or recovery code for an access token. The challenge is
	 * single-use and expires 5 minutes after login.
	 */
	async verifyMfa(payload: IMfaVerifyPayload): Promise<ILoginResponse> {
		if (!payload?.mfa_token) throw new ValidationError('mfa_token is required');
		if (!payload.code?.trim()) throw new ValidationError('code is required');
		return this.call('Two-factor verification failed', () =>
			this.http.post(
				'/authentication/mfa/verify',
				{ mfa_token: payload.mfa_token, code: payload.code.trim() },
				publicRequestConfig(),
			),
		);
	}

	/** `GET /users/self/mfa` — enrolled two-factor methods and remaining recovery codes. */
	async listMfaMethods(): Promise<IMfaStatus> {
		return this.call('Failed to list two-factor methods', () => this.http.get('/users/self/mfa'));
	}

	/**
	 * `POST /users/self/mfa/totp` — start authenticator enrollment. The secret
	 * and provisioning URI are returned only once; two-factor stays inactive
	 * until {@link confirmTotpEnrollment}.
	 */
	async startTotpEnrollment(label?: string): Promise<ITotpEnrollment> {
		return this.call('Failed to start authenticator enrollment', () =>
			this.http.post('/users/self/mfa/totp', label ? { label } : {}),
		);
	}

	/**
	 * `PUT /users/self/mfa/totp/confirm` — activate the method with a live code
	 * and receive one-time recovery codes. Replacing a confirmed method also
	 * requires `password` or `reauth_code`.
	 */
	async confirmTotpEnrollment(payload: ITotpConfirmPayload): Promise<IMfaRecoveryCodes> {
		if (!payload?.id) throw new ValidationError('id is required');
		if (!payload.code?.trim()) throw new ValidationError('code is required');
		return this.call('Failed to confirm authenticator enrollment', () =>
			this.http.put('/users/self/mfa/totp/confirm', payload),
		);
	}

	/** `POST /users/self/mfa/recovery-codes` — issue ten new recovery codes, invalidating the old set. */
	async regenerateRecoveryCodes(payload: IMfaReauthPayload): Promise<IMfaRecoveryCodes> {
		return this.call('Failed to regenerate recovery codes', () =>
			this.http.post('/users/self/mfa/recovery-codes', requireReauth(payload)),
		);
	}

	/**
	 * `DELETE /users/self/mfa/{methodId}` — remove a method. Removing the last
	 * one also discards the recovery codes.
	 */
	async removeMfaMethod(
		methodId: string,
		payload: IMfaReauthPayload,
	): Promise<{ is_mfa_enabled: boolean }> {
		const id = this.requireId(methodId, 'Method ID');
		const data = requireReauth(payload);
		return this.call('Failed to remove two-factor method', () =>
			this.http.delete(`/users/self/mfa/${id}`, { data }),
		);
	}

	/** `POST /authentication/social-login` — exchange a provider token for an Assinafy JWT. */
	async socialLogin(payload: {
		provider: SocialLoginProvider;
		token: string;
		has_accepted_terms: boolean;
	}): Promise<ILoginResponse> {
		if (payload.provider !== 'google') throw new ValidationError('provider must be google');
		if (!payload.token) throw new ValidationError('token is required');
		return this.call('Social login failed', () =>
			this.http.post('/authentication/social-login', payload, publicRequestConfig()),
		);
	}

	/** `POST /auth/link-social-login` — link a Google identity to the current user. */
	async linkSocialLogin(payload: {
		provider: SocialLoginProvider;
		token: string;
	}): Promise<IStatusResponse> {
		if (payload.provider !== 'google') throw new ValidationError('provider must be google');
		if (!payload.token) throw new ValidationError('token is required');
		return this.call('Failed to link social login', () =>
			this.http.post('/auth/link-social-login', payload),
		);
	}

	/** `POST /users/api-keys` — generate (and rotate) the current user's API key. */
	async createApiKey(password: string): Promise<IApiKeyResponse> {
		if (!password) throw new ValidationError('password is required');
		return this.call('Failed to create API key', () =>
			this.http.post('/users/api-keys', { password }),
		);
	}

	/**
	 * `GET /users/api-keys` — fetch a masked version of the current API key, or
	 * `null` if no key has been generated yet.
	 */
	async getApiKey(): Promise<IMaskedApiKeyResponse> {
		// Use callOptional so a 404 ("no key generated yet") resolves to null —
		// matching this method's documented contract — instead of throwing.
		const result = await this.callOptional<IMaskedApiKeyResponse>('Failed to fetch API key', () =>
			this.http.get('/users/api-keys'),
		);
		return result ?? null;
	}

	/** `DELETE /users/api-keys` — revoke the current API key. */
	async deleteApiKey(): Promise<IEmptyResult> {
		return this.call('Failed to delete API key', () => this.http.delete('/users/api-keys'));
	}

	/** `PUT /authentication/change-password` — change the authenticated user's password. */
	async changePassword(payload: {
		email: string;
		password: string;
		new_password: string;
	}): Promise<{ email: string }> {
		if (!payload.email) throw new ValidationError('email is required');
		if (!payload.password) throw new ValidationError('password is required');
		if (!payload.new_password) throw new ValidationError('new_password is required');
		return this.call('Failed to change password', () =>
			this.http.put('/authentication/change-password', payload),
		);
	}

	/** `PUT /authentication/request-password-reset` — email a reset link to the user. */
	async requestPasswordReset(email: string): Promise<{ email: string }> {
		if (!email) throw new ValidationError('email is required');
		return this.call('Failed to request password reset', () =>
			this.http.put('/authentication/request-password-reset', { email }, publicRequestConfig()),
		);
	}

	/** `PUT /authentication/reset-password` — complete a password reset using the emailed token. */
	async resetPassword(payload: {
		email: string;
		token?: string;
		new_password: string;
	}): Promise<{ email: string }> {
		if (!payload.email) throw new ValidationError('email is required');
		if (!payload.new_password) throw new ValidationError('new_password is required');
		return this.call('Failed to reset password', () =>
			this.http.put('/authentication/reset-password', payload, publicRequestConfig()),
		);
	}
}
