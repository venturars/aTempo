-- PostgreSQL core de aTempo. Seis tablas. Sin session, asistencia ni contraseña.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text NOT NULL UNIQUE
);

CREATE TABLE person (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identification_document text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  phone text
);

CREATE TABLE course (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization (id),
  name text NOT NULL,
  acronym text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  contract_address text NOT NULL UNIQUE,
  UNIQUE (organization_id, acronym),
  CHECK (end_at > start_at),
  CHECK (contract_address ~ '^0x[0-9a-fA-F]{40}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS person_email_lower_idx ON person (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS course_contract_address_lower_idx ON course (lower(contract_address));

CREATE TABLE person_course (
  person_id uuid NOT NULL REFERENCES person (id),
  course_id uuid NOT NULL REFERENCES course (id),
  PRIMARY KEY (person_id, course_id)
);

CREATE INDEX person_course_course_id_idx ON person_course (course_id);

CREATE TABLE role (
  name text PRIMARY KEY,
  CHECK (name IN ('organization_admin', 'teacher', 'student'))
);

INSERT INTO role (name) VALUES
  ('organization_admin'),
  ('teacher'),
  ('student');

CREATE TABLE person_role (
  person_id uuid NOT NULL REFERENCES person (id),
  role text NOT NULL REFERENCES role (name),
  PRIMARY KEY (person_id, role)
);

CREATE FUNCTION person_role_student_is_exclusive() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'student' AND EXISTS (
    SELECT 1 FROM person_role
    WHERE person_id = NEW.person_id AND role <> 'student'
  ) THEN
    RAISE EXCEPTION 'un student no puede llevar otro rol';
  END IF;

  IF NEW.role <> 'student' AND EXISTS (
    SELECT 1 FROM person_role
    WHERE person_id = NEW.person_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'un student no puede llevar otro rol';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER person_role_student_is_exclusive
BEFORE INSERT OR UPDATE ON person_role
FOR EACH ROW
EXECUTE FUNCTION person_role_student_is_exclusive();
