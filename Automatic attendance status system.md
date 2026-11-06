# Automatic attendance status system

Se propone incorporar un sistema estandarizado de estados para identificar la situación de cada alumno durante una sesión de clase.

Este documento complementa el [documento de constitución](./README.md) de aTempo.

## Estados de asistencia

| Estado | Descripción |
|---|---|
| Pendiente | Asistencia todavía no registrada. |
| Presente | Alumno que ha asistido puntualmente. |
| Retraso | Alumno que ha llegado después del inicio. |
| Ausente | Alumno que no ha asistido a la sesión. |
| Salida anticipada | Alumno que abandona la sesión antes de finalizar. |

## Estados de los justificantes

Los justificantes tendrán un ciclo de vida independiente del estado de asistencia:

- No presentado.
- Pendiente de revisión.
- Aprobado.
- Rechazado.

Una ausencia justificada seguirá conservando el registro original de ausencia, pero se identificará como justificada en las estadísticas y los informes.

## Reglas de negocio

- Cada alumno tendrá un registro de asistencia por sesión.
- El estado inicial será Pendiente.
- El profesor podrá registrar y corregir la asistencia.
- Se almacenará la hora de entrada y salida cuando corresponda.
- Los retrasos deberán permitir calcular el tiempo transcurrido desde el inicio de la sesión.
- Las salidas anticipadas deberán registrar la hora de salida.
- Los alumnos podrán solicitar correcciones de sus registros, pero no modificarlos directamente.
- Las modificaciones deberán conservar un historial de auditoría.
- Las ausencias justificadas y no justificadas deberán diferenciarse en las estadísticas.

## Gestión de permisos

- Profesor: registrar y corregir estados de asistencia.
- Alumno: consultar su historial y solicitar correcciones.
- Administrador de la organización: consultar registros, revisar justificantes y supervisar incidencias.

## Objetivos

- Unificar los criterios de registro de asistencia.
- Evitar inconsistencias entre profesores y administradores.
- Facilitar el cálculo de porcentajes de asistencia.
- Mejorar la generación de estadísticas e informes.
- Garantizar la trazabilidad de las modificaciones.

## Pendiente

Queda pendiente definir:

- Los umbrales de retraso.
- Las reglas de cálculo de asistencia.
- Los criterios de aprobación de justificantes.
