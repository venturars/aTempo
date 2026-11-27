from typing import TypeVar

from pydantic import BaseModel, ValidationError

from data_access_python.shared.errors import fail

Model = TypeVar("Model", bound=BaseModel)


def validate_model(model_class: type[Model], value: object) -> Model:
    """Valida `value` con el modelo y devuelve el modelo.

    Los campos y las reglas del modelo lanzan los errores del catálogo con
    `fail`. Si aun así Pydantic lanza su propio `ValidationError` (un caso que
    ningún `assert_*` cubre), sale como `ValidationError` del catálogo con el
    reason `format` y la label del primer campo que falló: hacia fuera nunca
    sale un error de Pydantic.
    """
    try:
        return model_class.model_validate(value)
    except ValidationError as error:
        entity = model_class.model_config.get("title") or "fecha"
        location = error.errors(include_input=False)[0]["loc"]
        field = ".".join(str(part) for part in location)
        label = f"{entity}.{field}" if field else entity
        fail(label, "format", cause=error)  # type: ignore[arg-type]
