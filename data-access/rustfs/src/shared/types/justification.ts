export interface JustificationCreate {
  document_id: string
  content_type: string
  body: Uint8Array
}

export interface Justification extends JustificationCreate {
  etag: string
}
