import type {
	AssignmentMethod,
	AssignmentNotificationMethod,
	AssignmentVerificationMethod,
	ICollectAssignmentEntry,
	IDocumentActivity,
	IPaginationParams,
	ISigningUrl,
} from './types.js';

/** All envelope signers act in parallel; certificate signers must be alone on each document. */
export interface IEnvelopeSigner {
	id: string;
	verification_method?: AssignmentVerificationMethod;
	notification_methods?: AssignmentNotificationMethod[];
	embedded?: boolean;
}

/** Uploaded, processed document without an assignment. */
export interface IEnvelopeDocumentPayload {
	id: string;
	signer_ids: string[];
	method?: AssignmentMethod;
	entries?: ICollectAssignmentEntry[];
	expires_at?: string | number | null;
	copy_receiver_ids?: string[];
}

export interface ICreateEnvelopePayload {
	name: string;
	message?: string | null;
	max_total_credits?: number;
	signers: IEnvelopeSigner[];
	documents: IEnvelopeDocumentPayload[];
}

export interface IUpdateEnvelopePayload {
	name?: string;
	message?: string | null;
	/** Every current document exactly once, in the desired order. */
	document_ids?: string[];
}

export interface IEnvelopeListParams extends IPaginationParams {
	search?: string;
	status?: 'open' | 'closed';
}

export interface IDocumentEnvelope {
	resource?: string;
	id: string;
	name: string;
	message: string | null;
	documents: Array<{
		id: string;
		position: number;
		name: string;
		status: string;
		artifacts: Record<string, string>;
		signers: Array<{
			id: string;
			full_name: string;
			email: string | null;
			whatsapp_phone_number: string | null;
			completed: boolean;
			signed_at: string | null;
		}>;
	}>;
	counts: Record<string, number> | null;
	signing_urls: ISigningUrl[];
	created_at: string;
}

export interface IEnvelopeActivity extends IDocumentActivity {
	document_id: string;
	document_name: string;
}

export interface IEnvelopeCancellation {
	id: string;
	status: string;
	cancelled: boolean;
}

export interface IEnvelopeResendResponse {
	is_sent: boolean;
	envelope_id: string;
	signer_id: string;
}
