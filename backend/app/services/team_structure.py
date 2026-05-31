from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class RoleInfo:
    role_id: Optional[str]
    role_name: Optional[str]
    group_id: Optional[str]
    group_name: Optional[str]


def _groups(structure: dict[str, Any]) -> list[dict[str, Any]]:
    groups = structure.get("groups")
    return groups if isinstance(groups, list) else []


def _roles(structure: dict[str, Any]) -> list[dict[str, Any]]:
    roles = structure.get("roles")
    return roles if isinstance(roles, list) else []


def resolve_role(
    structure: Optional[dict[str, Any]],
    role_id: Optional[str],
) -> RoleInfo:
    if not role_id or not structure:
        return RoleInfo(None, None, None, None)

    role = next((r for r in _roles(structure) if r.get("id") == role_id), None)
    if not role:
        return RoleInfo(role_id, None, None, None)

    group_id = role.get("group_id")
    group = next((g for g in _groups(structure) if g.get("id") == group_id), None) if group_id else None

    return RoleInfo(
        role_id=role_id,
        role_name=role.get("name"),
        group_id=group_id,
        group_name=group.get("name") if group else None,
    )


def role_ids_for_group(structure: Optional[dict[str, Any]], group_id: str) -> list[str]:
    if not structure:
        return []
    return [r["id"] for r in _roles(structure) if r.get("group_id") == group_id and r.get("id")]


def filter_product_ids_by_team(
    product_ids: list[int],
    products_by_id: dict[int, Any],
    structure: Optional[dict[str, Any]],
    role_id: Optional[str] = None,
    group_id: Optional[str] = None,
) -> list[int]:
    if not role_id and not group_id:
        return product_ids

    allowed_role_ids: Optional[set[str]] = None
    if role_id:
        allowed_role_ids = {role_id}
    elif group_id and structure:
        group_roles = role_ids_for_group(structure, group_id)
        allowed_role_ids = set(group_roles)

    if allowed_role_ids is None:
        return product_ids

    filtered: list[int] = []
    for pid in product_ids:
        product = products_by_id.get(pid)
        if product and product.team_role_id in allowed_role_ids:
            filtered.append(pid)
    return filtered
