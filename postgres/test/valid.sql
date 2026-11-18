-- Filas válidas del core. Los UUID son fijos para los casos que deben fallar.

INSERT INTO organization (id, name, tax_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme', 'B12345678');

INSERT INTO person (id, identification_document, email, first_name, last_name) VALUES
  ('22222222-2222-2222-2222-222222222222', '12345678A', 'ana@example.com', 'Ana', 'Lopez'),
  ('33333333-3333-3333-3333-333333333333', '87654321B', 'bruno@example.com', 'Bruno', 'Diaz');

INSERT INTO course (
  id, organization_id, name, acronym, start_at, end_at, contract_address
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Solidity',
  'SOL',
  '2026-01-01 00:00:00+00',
  '2026-06-01 00:00:00+00',
  '0x1234567890abcdef1234567890abcdef12345678'
);

INSERT INTO person_course (person_id, course_id) VALUES
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444');

INSERT INTO person_role (person_id, role) VALUES
  ('22222222-2222-2222-2222-222222222222', 'teacher'),
  ('22222222-2222-2222-2222-222222222222', 'organization_admin'),
  ('33333333-3333-3333-3333-333333333333', 'student');
