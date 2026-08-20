import { ValidationError } from '../errors.js';
import type {
	IApiKeyResponse,
	IEmptyResult,
	ILoginResponse,
	IMaskedApiKeyResponse,
	IStatusResponse,
	SocialLoginProvider,
} from '../types.js';
import { publicRequestConfig } from '../utils.js';
import { BaseResource } from './base.js';

/**
 * Authentication endpoints (login, social login, password management) and
 * personal API key management (`/users/api-keys`).
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

	/** `POST /authentication/social-login` — exchange a provider token for an Assinafy JWT. */
	async socialLogin(payload: {
		provider: string;
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
