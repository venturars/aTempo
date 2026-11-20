-- Índices unique lower de 01_schema.sql para volúmenes Docker que ya existían.
-- Falla si ya hay emails, direcciones, tax_id o DNI que solo se diferencian en mayúsculas.

CREATE UNIQUE INDEX IF NOT EXISTS person_email_lower_idx ON person (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS course_contract_address_lower_idx ON course (lower(contract_address));
CREATE UNIQUE INDEX IF NOT EXISTS organization_tax_id_lower_idx ON organization (lower(tax_id));
CREATE UNIQUE INDEX IF NOT EXISTS person_identification_document_lower_idx ON person (lower(identification_document));
