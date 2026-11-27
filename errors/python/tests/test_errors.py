import unittest

from atempo_errors import (
    ConfigurationError,
    ConflictError,
    DomainError,
    ErrorReason,
    NotFoundError,
    PersistenceError,
    ValidationError,
    create_error_factory,
)

TEST_REASONS: dict[str, ErrorReason] = {
    "invalid": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} no es válido",
    },
    "missing": {
        "kind": "NOT_FOUND",
        "message": lambda label: f"{label} no existe",
    },
    "taken": {
        "kind": "CONFLICT",
        "message": lambda label: f"{label} ya existe",
    },
    "unset": {
        "kind": "CONFIGURATION",
        "message": lambda label: f"{label} no está configurado",
    },
    "unmapped": {
        "kind": "PERSISTENCE",
        "message": lambda label: f"error de {label}",
    },
}

plain_factory = create_error_factory(TEST_REASONS)

factory_with_messages = create_error_factory(
    TEST_REASONS,
    {"thing.code.taken": "el código ya está en uso"},
)


class CreateErrorFactoryTests(unittest.TestCase):
    def test_builds_id_kind_entity_and_field_from_the_catalog(self) -> None:
        error = plain_factory.domain_error("thing.code", "taken")
        self.assertIsInstance(error, ConflictError)
        self.assertEqual(error.id, "thing.code.taken")
        self.assertEqual(error.kind, "CONFLICT")
        self.assertEqual(error.entity, "thing")
        self.assertEqual(error.field, "code")
        self.assertEqual(str(error), "thing.code ya existe")

    def test_uses_the_catalog_message_override(self) -> None:
        self.assertEqual(
            str(factory_with_messages.domain_error("thing.code", "taken")),
            "el código ya está en uso",
        )
        self.assertEqual(
            str(factory_with_messages.domain_error("thing", "taken")),
            "thing ya existe",
        )

    def test_fail_raises_and_keeps_the_cause(self) -> None:
        cause = ConnectionError("connection refused")
        with self.assertRaises(PersistenceError) as caught:
            plain_factory.fail("thing", "unmapped", cause=cause)
        error = caught.exception
        self.assertEqual(error.id, "thing.unmapped")
        self.assertEqual(error.kind, "PERSISTENCE")
        self.assertEqual(error.entity, "thing")
        self.assertIsNone(error.field)
        self.assertEqual(str(error), "error de thing")
        self.assertIs(error.__cause__, cause)

    def test_maps_every_kind_to_its_class(self) -> None:
        class_by_reason: dict[str, type[DomainError]] = {
            "invalid": ValidationError,
            "missing": NotFoundError,
            "taken": ConflictError,
            "unset": ConfigurationError,
            "unmapped": PersistenceError,
        }
        for reason, error_class in class_by_reason.items():
            error = plain_factory.domain_error("thing", reason)
            self.assertIsInstance(error, error_class)
            self.assertIsInstance(error, DomainError)

    def test_rejects_a_reason_outside_the_catalog(self) -> None:
        with self.assertRaises(KeyError):
            plain_factory.domain_error("thing", "gone")


if __name__ == "__main__":
    unittest.main()
