-- Índices de unicidad en minúsculas. Init de Docker solo corre con volumen vacío.
-- Falla si ya hay emails o direcciones que solo se diferencian en mayúsculas.

CREATE UNIQUE INDEX IF NOT EXISTS person_email_lower_idx ON person (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS course_contract_address_lower_idx ON course (lower(contract_address));
