import type { CentrePreview } from './centre'

/**
 * Generic tagged union for service call results.
 * Prevents throw-based control flow in components.
 */
export type ServiceResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string }

/**
 * Contract all CentreService implementations must satisfy.
 * Mock and real REST implementations are interchangeable.
 */
export interface CentreService {
  listPreviews(): Promise<readonly CentrePreview[]>
  getDetail(id: string): Promise<CentrePreview>
}
