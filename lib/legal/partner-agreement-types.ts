export interface AgreementSection {
  key: string
  heading: string
  subsections?: AgreementSubsection[]
  body?: AgreementBlock[]
}

export interface AgreementSubsection {
  key: string
  heading: string
  body: AgreementBlock[]
}

export type AgreementBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'note'; text: string }
  | { type: 'table'; rows: [string, string][] }
