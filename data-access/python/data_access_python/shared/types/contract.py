from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator

from data_access_python.shared.errors import fail


class Contract(BaseModel):
    """Base de los contratos: estrictos, inmutables y con errores del catálogo.

    Cada contrato hereda de esta clase y pone su entidad en `title`
    (`model_config = ConfigDict(title="session")`). Pydantic combina esa
    configuración con la de aquí, así que `strict` y `frozen` se heredan.
    """

    model_config = ConfigDict(strict=True, frozen=True)

    @model_validator(mode="before")
    @classmethod
    def read_every_field(cls, value: Any) -> Any:
        """Rellena con `None` los campos que faltan.

        Así un campo ausente pasa por su `assert_*` y da el mismo error que un
        campo a `None` (`session.course_id debe ser un string no vacío`), y no
        el `missing` de Pydantic.
        """
        if isinstance(value, BaseModel):
            value = value.model_dump()
        if not isinstance(value, dict):
            fail(cls.model_config["title"], "object")  # type: ignore[arg-type]
        return {name: value.get(name) for name in cls.model_fields}
