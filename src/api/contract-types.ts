import type { DocumentStatus, IDocumentListItem, IPaginationParams } from './types.js';

export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type ContractRelationType = 'amendment' | 'renewal' | 'termination';

/** External system identifier; sending the list replaces all existing references. */
export interface IContractExternalReference {
	system: string;
	id: string;
}

/** PUT contract terms. Omitted attributes stay unchanged; null clears them. */
export interface ISetContractPayload {
	status?: ContractStatus;
	counterparty_name?: string | null;
	/** Formatted CPF/CNPJ forwarded unchanged for server validation. */
	counterparty_taxpayer_id?: string | null;
	/** Nonnegative amount with at most two decimal places. */
	value?: number | null;
	currency?: string | null;
	/** Calendar dates (YYYY-MM-DD), not timestamps. */
	start_date?: string | null;
	end_date?: string | null;
	/** null resets to false. */
	auto_renew?: boolean | null;
	renewal_term_months?: number | null;
	notice_period_days?: number | null;
	owner_id?: string | null;
	metadata?: Record<string, string> | null;
	external_references?: IContractExternalReference[] | null;
	/** Link an instrument to a contract; null unlinks a pending instrument. */
	parent_document_id?: string | null;
	relation_type?: ContractRelationType;
	/** Exact timestamp read from the contract/link; a stale write returns 409. */
	updated_at?: string | null;
}

/** Tracked terms returned by list/get/set/renew/terminate/related. */
export interface IContract {
	resource?: 'document_contract';
	document_id: string;
	status: ContractStatus;
	counterparty_name: string | null;
	counterparty_taxpayer_id: string | null;
	value: number | null;
	currency: string | null;
	start_date: string | null;
	end_date: string | null;
	auto_renew: boolean;
	renewal_term_months: number | null;
	notice_period_days: number | null;
	/** Starts at 1 and advances on renewal or an end-date change. */
	term: number;
	owner_id: string | null;
	metadata: Record<string, string> | null;
	external_references: IContractExternalReference[];
	/** Present with expand=document. */
	document?: IDocumentListItem;
	/** Present on a single-contract or family read. */
	amendments?: IContractAmendment[];
	created_at: string;
	updated_at: string;
}

/** An instrument's proposed changes; null on a pending link removes a delta key. */
export type IContractAmendmentTerms = Pick<
	ISetContractPayload,
	| 'counterparty_name'
	| 'counterparty_taxpayer_id'
	| 'value'
	| 'currency'
	| 'start_date'
	| 'end_date'
	| 'auto_renew'
	| 'renewal_term_months'
	| 'notice_period_days'
	| 'metadata'
>;

/** Returned by get/set for an amendment document, and inside a root's amendments. */
export interface IContractAmendment {
	resource?: 'document_contract_amendment';
	document_id: string;
	document_name: string;
	parent_document_id: string;
	relation_type: ContractRelationType;
	number: number | null;
	status: 'pending' | 'applied';
	document_status: DocumentStatus;
	apply_error: string | null;
	currency: string | null;
	terms: IContractAmendmentTerms | null;
	/** Preview while pending, immutable before/after record once applied. */
	changes: Record<string, { from: unknown; to: unknown }> | null;
	applied_at: string | null;
	created_at: string;
	updated_at: string;
}

/** Filters only narrow the list; default order is -updated_at. */
export interface IContractListParams extends IPaginationParams {
	status?: ContractStatus | ContractStatus[] | string;
	counterparty?: string;
	search?: string;
	end_date_from?: string;
	end_date_to?: string;
	/** 0 includes today, measured in Brasília calendar days. */
	ending_within_days?: number;
	external_system?: string;
	external_id?: string;
	sort?: 'end_date' | '-end_date' | 'updated_at' | '-updated_at';
	expand?: 'document';
}

/** Supply the current term or an explicit later end date to prevent double renewal. */
export interface IRenewContractPayload {
	term?: number;
	end_date?: string | null;
	value?: number | null;
	updated_at?: string | null;
}

export interface ITerminateContractPayload {
	/** At most 500 Unicode characters; retained in the termination event. */
	reason?: string | null;
	updated_at?: string | null;
}
